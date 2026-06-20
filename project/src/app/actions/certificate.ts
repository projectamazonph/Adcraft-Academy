'use server';

import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';
import type { ActionResult } from './types';

export async function generateCertificate(): Promise<ActionResult<string>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, xp: true, level: true },
    });
    if (!user) return { success: false, error: 'User not found', code: 'NOT_FOUND' };

    // ponytail: check all 5 modules completed
    const completed = await db.moduleProgress.count({
      where: { userId, status: 'COMPLETED' },
    });
    const requiredModules = 5;

    const userName = user.name || user.email?.split('@')[0] || 'Learner';
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const certId = `ADC-${userId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const html = `<!DOCTYPE html>
<html><head><style>
  @page { margin: 0; size: landscape; }
  body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh;
    font-family: 'Georgia', serif; background: #0a0a0a; color: #e0e0e0; }
  .cert { width: 900px; padding: 60px; border: 3px solid #b8860b; border-radius: 16px;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    box-shadow: 0 0 60px rgba(184,134,11,0.15); text-align: center; position: relative; }
  .cert::before { content: ''; position: absolute; inset: 8px; border: 1px solid rgba(184,134,11,0.3);
    border-radius: 10px; pointer-events: none; }
  h1 { font-size: 14px; letter-spacing: 4px; text-transform: uppercase; color: #b8860b; margin-bottom: 30px; }
  h2 { font-size: 36px; font-weight: bold; margin: 20px 0; color: #f0f0f0; }
  .name { font-size: 42px; font-weight: bold; color: #d4a843; margin: 15px 0; border-bottom: 2px solid #b8860b;
    display: inline-block; padding-bottom: 8px; }
  .body-text { font-size: 15px; color: #a0a0a0; line-height: 1.8; margin: 20px 0; }
  .details { display: flex; justify-content: center; gap: 40px; margin: 25px 0; font-size: 13px; color: #888; }
  .footer { margin-top: 30px; font-size: 11px; color: #666; }
  .seal { width: 60px; height: 60px; border: 2px solid #b8860b; border-radius: 50%; margin: 0 auto 15px;
    display: flex; align-items: center; justify-content: center; font-size: 10px; color: #b8860b; }
  @media print { body { background: white; color: black; }
    .cert { border-color: #8a6b0b; box-shadow: none; background: white !important; }
    .cert::before { border-color: #ccc; } h1, .seal { color: #8a6b0b; }
    h2, .name { color: #1a1a1a; } .body-text { color: #444; } .details { color: #666; } .footer { color: #999; } }
</style></head><body>
<div class="cert">
  <div class="seal">ADC</div>
  <h1>Certificate of Completion</h1>
  <h2>AdCraft PPC Command Center</h2>
  <div class="name">${userName}</div>
  <div class="body-text">
    Has successfully completed all 5 modules and mastered the fundamentals of<br/>
    Amazon PPC advertising, including campaign architecture, bidding strategies,<br/>
    search term optimization, and performance metrics analysis.
${completed >= requiredModules ? '' : '<br/><em style="color:#b8860b;">⏳ Complete all modules to earn this certificate</em>'}
  </div>
  <div class="details">
    <span>Level ${user.level}</span>
    <span>${user.xp.toLocaleString()} XP</span>
    <span>${date}</span>
  </div>
  <div class="footer">Certificate ID: ${certId} &mdash; AdCraft PPC Command Center &mdash; adcraft.app</div>
</div>
</body></html>`;

    return { success: true, data: html };
  } catch (error) {
    logger.error('generateCertificate failed', { error: String(error) });
    return { success: false, error: 'Failed to generate certificate', code: 'CERT_ERROR' };
  }
}
