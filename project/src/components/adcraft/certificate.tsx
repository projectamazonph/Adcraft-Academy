'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Award, Download, Loader2, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCertificate } from '@/app/actions/certificate';

export function CertificateGenerator() {
  const [loading, setLoading] = useState(false);
  const [html, setHtml] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    const res = await generateCertificate();
    setLoading(false);
    if (res.success) {
      setHtml(res.data);
      // Trigger print dialog
      setTimeout(() => { if (typeof window !== "undefined") window.print(); }, 300);
    }
  }, []);

  if (html) {
    return (
      <div className="print-margins">
        <div dangerouslySetInnerHTML={{ __html: html }} />
        <div className="no-print text-center mt-6 space-x-3">
          <Button onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Print</Button>
          <Button variant="outline" onClick={() => setHtml(null)}>Back</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center space-y-6 py-12">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 inline-block">
        <Award className="h-12 w-12 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold">Your Certificate</h2>
      <p className="text-muted-foreground text-sm">
        Complete all 5 modules and pass the final assessment to earn your AdCraft Certificate of Completion.
      </p>
      <Button onClick={handleGenerate} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? 'Generating...' : 'Generate Certificate'}
      </Button>
    </motion.div>
  );
}
