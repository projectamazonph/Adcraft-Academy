'use client';

/**
 * AdCraft: Certificate Manager (Phase 3)
 *
 * Shows certificate eligibility progress, issue flow, and existing cert info.
 * Replaces the basic CertificateGenerator with a full lifecycle UI.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock,
  Copy,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { getCertProgress, issueCertificate } from '@/app/actions/certificate-lifecycle';
import type { CertProgressInfo, CertificateView } from '@/app/actions/certificate-lifecycle';

const REQUIREMENTS = [
  { label: 'Complete all 5 modules', key: 'modules' as const },
  { label: 'Pass quizzes (70%+) in 3+ modules', key: 'quizzes' as const },
];

type StepStatus = 'pending' | 'done' | 'active';

export function CertificateManager() {
  const [progress, setProgress] = useState<CertProgressInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [cert, setCert] = useState<CertificateView | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    setLoading(true);
    const res = await getCertProgress();
    if (res.success && res.data) {
      setProgress(res.data);
    }
    setLoading(false);
  }

  async function handleIssue() {
    setIssuing(true);
    setError(null);
    const res = await issueCertificate();
    setIssuing(false);
    if (res.success && res.data) {
      setCert(res.data);
    } else {
      setError(res.error || 'Failed to issue certificate');
    }
  }

  async function handleCopyHash() {
    if (cert?.verificationHash) {
      await navigator.clipboard.writeText(
        `${window.location.origin}/verify/${cert.verificationHash}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Certificate already issued
  if (progress?.existingCert || cert) {
    const activeCert = cert || progress?.existingCert!;
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      >
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 inline-block">
              <Award className="h-12 w-12 text-emerald-400" />
            </div>
            <CardTitle className="text-xl">{activeCert.title}</CardTitle>
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20">
              {activeCert.status.toUpperCase()}
            </Badge>

            <div className="flex justify-center gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Issued</p>
                <p className="font-medium">{new Date(activeCert.issuedAt).toLocaleDateString()}</p>
              </div>
              {activeCert.expiresAt && (
                <div>
                  <p className="text-muted-foreground">Expires</p>
                  <p className="font-medium">{new Date(activeCert.expiresAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            {/* Verification link */}
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleCopyHash}>
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy Verify Link'}
              </Button>
              {activeCert.verificationHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() =>
                    window.open(
                      `${window.location.origin}/verify/${activeCert.verificationHash}`,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Verify
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const modulesProgress = progress
    ? Math.round((progress.modulesCompleted / progress.totalModules) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
      className="space-y-6"
    >
      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 inline-block">
              <Award className="h-12 w-12 text-amber-400" />
            </div>
            <CardTitle>Your Certificate</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete all requirements to earn your AdCraft Certificate of Completion.
            </p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span className="font-medium">{progress?.modulesCompleted || 0}/{progress?.totalModules || 5} modules</span>
            </div>
            <Progress value={modulesProgress} className="h-2" />
          </div>

          {/* Requirements checklist */}
          <div className="space-y-3">
            {REQUIREMENTS.map((req) => {
              const done = req.key === 'modules'
                ? (progress?.modulesCompleted || 0) >= (progress?.totalModules || 5)
                : progress?.allQuizzesPassed || false;
              return (
                <div key={req.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className={done ? 'text-sm' : 'text-sm text-muted-foreground'}>
                    {req.label}
                  </span>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Issue button */}
          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}
          <Button
            className="w-full gap-2"
            onClick={handleIssue}
            disabled={issuing || !progress?.canIssue}
          >
            {issuing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            {issuing ? 'Issuing...' : progress?.canIssue ? 'Issue My Certificate' : 'Complete Requirements First'}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
