'use server';

/**
 * AdCraft: AI Mentor Server Action
 *
 * Implements the PPC Mentor AI agent using z-ai-web-dev-sdk.
 * Uses the production system prompt from the Content Production Kit
 * with PPC rule grounding and safety guardrails.
 *
 * IMPORTANT: This file ONLY exports async functions.
 * Types are in ./types.ts to avoid "Invalid Server Actions request" errors.
 *
 * Flow:
 * 1. chatWithMentor — Sends user message + context to LLM, returns full response
 *    (Non-streaming for simplicity; streaming can be added via API route later)
 * 2. getMentorContext — Builds AiMentorContext from user's current state
 */

import ZAI from 'z-ai-web-dev-sdk';
import { db } from '@/lib/db';
import { getAuthUserId } from '@/lib/auth-guard';
import { trackEvent } from './events';
import { logger } from '@/lib/logger';
import type {
  ActionResult,
  MentorChatOutput,
} from './types';

// ============================================================================
// PPC MENTOR SYSTEM PROMPT (Production-Ready)
// ============================================================================

const PPC_MENTOR_SYSTEM_PROMPT = `You are the PPC Mentor for AdCraft, an Amazon PPC training simulator.

YOUR ROLE: Teach concepts clearly, practically, and interactively using ONLY approved playbooks.
SOURCE OF TRUTH: Internal PPC Decision Matrix, Operations Playbook v7.6, Campaign Launch Prioritization Strategy. Always cite rule IDs when explaining decisions.

RULES:
1. NEVER make performance guarantees. Say "based on historical benchmarks" not "you will achieve."
2. NEVER recommend unsafe tactics, review manipulation, trademark abuse, or policy evasion.
3. When asked for action recommendations, ALWAYS ask for or infer: price, target ACoS, CVR, clicks, orders, spend, sales, lifecycle stage, inventory, category competitiveness.
4. If data is insufficient, say "INSUFFICIENT DATA" and recommend what to monitor next. Do NOT guess.
5. Keep responses under 150 words unless learner asks for deep dive.
6. Use plain English first, then technical terms. Define acronyms on first use.
7. Tone: Clear, practical, slightly playful. Not corporate oatmeal.

RESPONSE FORMAT:
- Direct answer (1 sentence)
- Rule citation [Rule ID] (when applicable)
- Example or analogy
- Next step or practice question

Use markdown formatting when helpful:
- Bold for key terms and metric names
- Bullet lists for step-by-step explanations
- Backtick code for formulas and metric abbreviations like ACoS, CPC
- Blockquotes for important rules or warnings
- Headings for multi-part answers

SAFETY: If user asks about black-hat tactics, respond: "I can't help with that. Here's a sustainable alternative aligned with Amazon policy: [safe option]."

CONTEXT AWARENESS: You will receive context about the learner's current module, lesson, and simulation state. Use this to personalize your response. If they just completed a simulation, offer specific feedback on their decisions. If they're reading a lesson, reinforce the key concepts.

PPC RULES REFERENCE (cite these by ID when explaining decisions):
- [ACOS_THRESHOLD] ACoS < 15% = Excellent, 15-25% = Good, 25-40% = Moderate, > 40% = Needs optimization
- [ACOS_BREAK_EVEN] Break-even ACoS = Profit Margin %. Target ACoS should be below break-even.
- [TACOS_HEALTHY] TACoS < 5% = Healthy, 5-10% = Moderate, > 10% = Ad-dependent
- [CPC_MAX] Max CPC = Product Price × Target ACoS × CVR. Never bid above this.
- [ROAS_BENCHMARK] RoAS > 4x = Strong, 2-4x = Average, < 2x = Underperforming
- [CTR_BENCHMARK] CTR > 0.5% for SP, > 0.3% for SB. Below threshold = relevancy issue.
- [NEG_KEYWORD_RULE] Negate search terms with > 10 clicks and 0 orders. Use exact match first.
- [BID_STRATEGY_START] New campaigns: Dynamic Bids Down Only. Switch to Up and Down after 2+ weeks of data.
- [CAMPAIGN_STRUCTURE] Separate campaigns by match type (Exact, Phrase, Broad) for budget control.
- [SPONSORED_PRODUCTS] Start with SP campaigns for direct ROI. Layer SB/SD for full-funnel.
- [BUDGET_PACING] Daily budget should allow at least 10 clicks (Budget ≥ 10 × avg CPC).
- [KEYWORD_HARVEST] Run Search Term Reports weekly. Promote high-converting terms to exact match.`;

// ============================================================================
// SERVER ACTION: Chat with Mentor
// ============================================================================

export async function chatWithMentor(
  userMessage: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  context?: string
): Promise<ActionResult<MentorChatOutput>> {
  try {
    // Input sanitization — prevent prompt injection
    const sanitizedMessage = userMessage
      .replace(/<[^>]*>/g, '') // Strip HTML tags
      .slice(0, 2000); // Limit length

    if (!sanitizedMessage.trim()) {
      return { success: false, error: 'Message cannot be empty', code: 'EMPTY_MESSAGE' };
    }

    const zai = await ZAI.create();

    // Build messages array with system prompt + history + current message
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      {
        role: 'system',
        content: context
          ? `${PPC_MENTOR_SYSTEM_PROMPT}\n\nLEARNER CONTEXT:\n${context}`
          : PPC_MENTOR_SYSTEM_PROMPT,
      },
    ];

    // Add chat history (last 10 messages for context window management)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role,
        content: msg.content.slice(0, 1000), // Limit each history message
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: sanitizedMessage,
    });

    const startTime = Date.now();

    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const latencyMs = Date.now() - startTime;
    const assistantMessage = completion.choices[0]?.message?.content || 'I apologize, I couldn\'t generate a response. Please try again.';

    return {
      success: true,
      data: {
        message: assistantMessage,
        latencyMs,
        model: completion.model || 'unknown',
      },
    };
  } catch (error) {
    logger.error('chatWithMentor failed', { error: String(error) });
    return {
      success: false,
      error: 'Failed to get AI mentor response. Please try again.',
      code: 'MENTOR_ERROR',
    };
  }
}

// ponytail: persist chat exchange to DB
export async function saveChatExchange(
  userMessage: string,
  aiResponse: string,
): Promise<ActionResult<null>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    // ponytail: one session per user, append to it
    let session = await db.aiChatSession.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!session) {
      session = await db.aiChatSession.create({ data: { userId, title: 'Mentor Chat' } });
    }

    await db.aiChatMessage.createMany({
      data: [
        { sessionId: session.id, role: 'user', content: userMessage },
        { sessionId: session.id, role: 'assistant', content: aiResponse },
      ],
    });

    return { success: true, data: null };
  } catch (error) {
    logger.error('saveChatExchange failed', { error: String(error) });
    return { success: false, error: 'Failed to save chat', code: 'SAVE_ERROR' };
  }
}

export async function getChatHistory(): Promise<ActionResult<{ role: string; content: string; createdAt: string }[]>> {
  try {
    const userId = await getAuthUserId();
    if (!userId) return { success: false, error: 'Not authenticated', code: 'UNAUTHENTICATED' };

    const session = await db.aiChatSession.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
    if (!session) return { success: true, data: [] };

    const messages = await db.aiChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true, createdAt: true },
    });

    return { success: true, data: messages };
  } catch (error) {
    logger.error('getChatHistory failed', { error: String(error) });
    return { success: false, error: 'Failed to load chat history', code: 'HISTORY_ERROR' };
  }
}
