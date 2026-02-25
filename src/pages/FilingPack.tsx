import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFilingPack, useGenerateFilingPack } from '@/hooks/useFilingPack';
import { useComputation } from '@/hooks/useComputation';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaxReturnDocument } from '@/components/TaxReturnDocument';
import { FilingInstructions } from '@/components/FilingInstructions';
import { FileText, Download, Printer, Loader2, Calculator, PartyPopper } from 'lucide-react';

export default function FilingPack() {
  const { selectedTaxYear } = useAppContext();
  const { data: pack } = useFilingPack();
  const { data: computation } = useComputation();
  const generatePack = useGenerateFilingPack();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    try {
      await generatePack.mutateAsync();
      toast({ title: 'Filing document generated!' });
    } catch {
      toast({ title: 'Error generating document', variant: 'destructive' });
    }
  };

  const summaryData = pack?.summaryJson ? JSON.parse(pack.summaryJson) : null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHTML = () => {
    const el = printRef.current;
    if (!el) return;
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Tax Return ${selectedTaxYear}</title>
<style>
body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#111}
table{width:100%;border-collapse:collapse}
th,td{padding:6px 12px;text-align:left;border-bottom:1px solid #ddd}
th{font-weight:600}
.text-right{text-align:right}
.font-mono{font-family:monospace}
.font-bold{font-weight:700}
.section-header{background:#f3f4f6;padding:6px 12px;border:1px solid #d1d5db;font-weight:700;text-transform:uppercase;font-size:13px;margin-top:24px;margin-bottom:12px}
.summary-row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #e5e7eb}
.total-row{border-top:2px solid #000;font-weight:700;font-size:16px;padding:8px 0}
.footer{border-top:2px solid #000;padding-top:16px;margin-top:32px;font-size:11px;color:#6b7280}
</style></head><body>${el.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-return-${selectedTaxYear}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Tax Return Document</h1>
          <p className="text-muted-foreground">Your annual return for {selectedTaxYear}</p>
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
                <Printer className="h-4 w-4 mr-1" /> Print / Save PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadHTML}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </div>

          {/* The printable document */}
          <Card className="print:shadow-none print:border-none">
            <CardContent className="p-6 md:p-10" ref={printRef}>
              <TaxReturnDocument data={summaryData} />
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
    </div>
  );
}
