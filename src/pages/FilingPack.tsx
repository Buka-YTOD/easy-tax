import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFilingPack, useGenerateFilingPack } from '@/hooks/useFilingPack';
import { useComputation } from '@/hooks/useComputation';
import { useAppContext } from '@/contexts/AppContext';
import { useIsAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaxReturnDocument } from '@/components/TaxReturnDocument';
import { FormH1Document } from '@/components/FormH1Document';
import { FormH2Document } from '@/components/FormH2Document';
import { FilingInstructions } from '@/components/FilingInstructions';
import { FileText, Download, Printer, Loader2, Calculator, PartyPopper, FileDown, Code2, Copy, Check } from 'lucide-react';
import { usePdfExport } from '@/hooks/usePdfExport';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const BASE_STYLES = `*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,Helvetica,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111;font-size:13px;line-height:1.5}
table{width:100%;border-collapse:collapse}
th,td{padding:5px 12px;text-align:left;border-bottom:1px solid #ddd;font-size:12px}
th{font-weight:600;background:#f9fafb}
td.text-right,th.text-right{text-align:right}
.font-mono{font-family:'Courier New',monospace}
.font-bold{font-weight:700}.font-semibold{font-weight:600}.font-medium{font-weight:500}
section{margin-bottom:20px}
section>div:first-child{background:#f3f4f6;padding:6px 12px;border:1px solid #d1d5db;margin-bottom:12px;display:flex;align-items:baseline;gap:8px}
section>div:first-child span{background:#000;color:#fff;padding:2px 6px;border-radius:2px;font-size:10px;font-weight:700}
section>div:first-child h3{font-weight:700;text-transform:uppercase;font-size:11px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 32px}
.grid>div{display:flex;flex-direction:column;padding:0 12px}
.grid>div>span:first-child{font-size:10px;color:#6b7280;text-transform:uppercase}
.grid>div>span:last-child{font-weight:500;font-size:12px;border-bottom:1px dotted #d1d5db;padding-bottom:4px;margin-top:2px}
.text-center{text-align:center}.text-right{text-align:right}
.italic{font-style:italic}.uppercase{text-transform:uppercase}
.border-t-2{border-top:2px solid #000}.border-b-2{border-bottom:2px solid #000}
div[style]{margin:0}
@media(max-width:640px){.grid{grid-template-columns:1fr}.hidden{display:none!important}}
@media print{body{margin:20px}}`;

function downloadHTMLFile(content: string, title: string, filename: string) {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>${BASE_STYLES}</style></head><body>${content}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FilingPack() {
  const { selectedTaxYear } = useAppContext();
  const { data: pack } = useFilingPack();
  const { data: computation } = useComputation();
  const { data: isAdmin } = useIsAdmin();
  const generatePack = useGenerateFilingPack();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const h1Ref = useRef<HTMLDivElement>(null);
  const h2Ref = useRef<HTMLDivElement>(null);
  const { exportToPdf, isExporting } = usePdfExport();
  const [showSchema, setShowSchema] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    try {
      await generatePack.mutateAsync();
      toast({ title: 'Filing document generated!' });
    } catch {
      toast({ title: 'Error generating document', variant: 'destructive' });
    }
  };

  const summaryData = pack?.summaryJson ? JSON.parse(pack.summaryJson) : null;
  const isBusinessFiler = summaryData?.profile?.filingType === 'Business';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const el = printRef.current;
    if (!el) return;
    const title = isBusinessFiler ? `Form H1 & H2 - ${selectedTaxYear}` : `Form A - Tax Return ${selectedTaxYear}`;
    const filename = isBusinessFiler ? `form-h1-h2-${selectedTaxYear}.html` : `tax-return-${selectedTaxYear}.html`;
    downloadHTMLFile(el.innerHTML, title, filename);
  };

  const handleDownloadH1 = () => {
    const el = h1Ref.current;
    if (!el) return;
    downloadHTMLFile(el.innerHTML, `Form H1 - Employer Declaration ${selectedTaxYear}`, `form-h1-${selectedTaxYear}.html`);
  };

  const handleDownloadH2 = () => {
    const el = h2Ref.current;
    if (!el) return;
    downloadHTMLFile(el.innerHTML, `Form H2 - Employee Certificate ${selectedTaxYear}`, `form-h2-${selectedTaxYear}.html`);
  };

  if (!computation && !pack) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Calculator className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Compute your tax first</h1>
        <p className="text-muted-foreground">
          You need to compute your tax before generating your filing document.
        </p>
        <Link to="/app/result">
          <Button size="lg">
            <Calculator className="h-5 w-5 mr-2" /> Go to Compute
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-8 shadow-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Generating PDF…</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">
            {isBusinessFiler ? 'Form H1 — Employer\'s Declaration' : 'Tax Return Document'}
          </h1>
          <p className="text-muted-foreground">
            {isBusinessFiler
              ? `Employer's Annual Declaration for ${selectedTaxYear}`
              : `Your annual return for ${selectedTaxYear}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGenerate} disabled={generatePack.isPending}>
            {generatePack.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            {pack ? 'Regenerate' : 'Generate Document'}
          </Button>
          {isAdmin && summaryData && (
            <Button variant="outline" onClick={() => setShowSchema(true)}>
              <Code2 className="h-4 w-4 mr-2" /> API Schema
            </Button>
          )}
        </div>
      </div>

      {pack && summaryData ? (
        <>
          <div className="flex items-center gap-3 print:hidden">
            <Badge variant={pack.status === 'Ready' ? 'default' : 'secondary'}>{pack.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Generated: {new Date(pack.generatedAt).toLocaleString()}
            </span>
            <div className="ml-auto flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-1" /> Print
              </Button>
              {isBusinessFiler ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => h1Ref.current && exportToPdf(h1Ref.current, `form-h1-${selectedTaxYear}.pdf`)} disabled={isExporting}>
                    <FileDown className="h-4 w-4 mr-1" /> H1 PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => h2Ref.current && exportToPdf(h2Ref.current, `form-h2-${selectedTaxYear}.pdf`)} disabled={isExporting}>
                    <FileDown className="h-4 w-4 mr-1" /> H2 PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => printRef.current && exportToPdf(printRef.current, `form-h1-h2-${selectedTaxYear}.pdf`)} disabled={isExporting}>
                    <FileDown className="h-4 w-4 mr-1" /> Both PDF
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => printRef.current && exportToPdf(printRef.current, `tax-return-${selectedTaxYear}.pdf`)} disabled={isExporting}>
                  <FileDown className="h-4 w-4 mr-1" /> Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* The printable document */}
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-6 md:p-10" ref={printRef}>
              {isBusinessFiler ? (
                <>
                  <div ref={h1Ref}>
                    <FormH1Document data={summaryData} />
                  </div>
                  <div ref={h2Ref} className="pdf-page-break-before">
                    <FormH2Document data={summaryData} />
                  </div>
                </>
              ) : (
                <TaxReturnDocument data={summaryData} />
              )}
            </CardContent>
          </Card>

          {/* Celebration */}
          <Card className="border-primary/20 bg-primary/5 print:hidden">
            <CardContent className="py-8 text-center">
              <PartyPopper className="h-10 w-10 mx-auto text-primary mb-3" />
              <h3 className="font-semibold text-lg">Your tax return is ready!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Print or download above. Submit through the FIRS e-filing portal or your nearest tax office.
              </p>
            </CardContent>
          </Card>


          <FilingInstructions />
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              Click "Generate Document" above to create your tax return document.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Admin-only: API request schema viewer */}
      {isAdmin && (
        <Dialog open={showSchema} onOpenChange={setShowSchema}>
          <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>API Request Schema</DialogTitle>
              <DialogDescription>
                JSON payload to send to the external PDF generation API.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(summaryData, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast({ title: 'Copied to clipboard' });
                }}
              >
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `api-schema-${selectedTaxYear}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-1" /> Download JSON
              </Button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border bg-muted p-4">
              <pre className="text-xs font-mono text-foreground whitespace-pre-wrap break-words">
                {JSON.stringify(summaryData, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
