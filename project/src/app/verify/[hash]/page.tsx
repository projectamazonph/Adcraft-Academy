/**
 * AdCraft: Certificate Verification Portal (Phase 3)
 *
 * Public page — no auth required. Anyone with the certificate hash
 * can verify its authenticity.
 *
 * Route: /verify/[hash]
 * - Valid hash → shows certificate details with validity badge
 * - Invalid hash → shows "Certificate not found" message
 */

import { Award, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { verifyCertificate } from '@/app/actions/certificate-lifecycle';

interface Props {
  params: Promise<{ hash: string }>;
}

export default async function VerifyPage({ params }: Props) {
  const { hash } = await params;
  const result = await verifyCertificate(hash);

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-card">
        <Card className="max-w-md w-full border-red-500/20 bg-red-500/5">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto" />
            <CardTitle>Verification Error</CardTitle>
            <p className="text-sm text-muted-foreground">{result.error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cert = result.data;

  if (!cert.valid && cert.status === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-card">
        <Card className="max-w-md w-full border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-8 text-center space-y-4">
            <XCircle className="h-12 w-12 text-amber-400 mx-auto" />
            <CardTitle>Certificate Not Found</CardTitle>
            <p className="text-sm text-muted-foreground">
              No certificate matches the provided verification code.
              Please check the URL and try again.
            </p>
            <p className="text-xs font-mono text-muted-foreground/60">{hash}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-card">
      <Card className="max-w-lg w-full">
        <CardContent className="pt-8 text-center space-y-6">
          {/* Badge */}
          <div className="flex justify-center">
            {cert.valid ? (
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
            ) : (
              <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20">
                <XCircle className="h-12 w-12 text-rose-400" />
              </div>
            )}
          </div>

          {/* Status badge */}
          <Badge
            className={cert.valid ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border-rose-500/20'}
          >
            {cert.valid ? 'VALID' : cert.status.toUpperCase()}
          </Badge>

          <div>
            <h1 className="text-2xl font-bold mb-1">{cert.title}</h1>
            <p className="text-lg text-muted-foreground">Issued to <span className="text-foreground font-semibold">{cert.userName}</span></p>
          </div>

          <div className="flex justify-center gap-8 text-sm">
            <div>
              <p className="text-muted-foreground">Issued</p>
              <p className="font-medium">{new Date(cert.issuedAt).toLocaleDateString()}</p>
            </div>
            {cert.expiresAt && (
              <div>
                <p className="text-muted-foreground">Expires</p>
                <p className="font-medium">{new Date(cert.expiresAt).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{cert.certType}</p>
            </div>
          </div>

          {/* Hash */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-[10px] text-muted-foreground mb-1">Verification Code</p>
            <p className="text-sm font-mono tracking-wider">{hash}</p>
          </div>

          {!cert.valid && (
            <p className="text-xs text-muted-foreground">
              This certificate is no longer valid. It was {cert.status}.
            </p>
          )}

          <p className="text-[10px] text-muted-foreground/60">
            AdCraft PPC Command Center &mdash; Certificate Verification Portal
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
