import { useFilingPack, useGenerateFilingPack } from '@/hooks/useFilingPack';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { JsonViewer } from '@/components/JsonViewer';
import { FileText, Download, Copy, Loader2 } from 'lucide-react';

export default function FilingPack() {
  const { selectedTaxYear } = useAppContext();
  const { data: pack } = useFilingPack();
  const generatePack = useGenerateFilingPack();
  const { toast } = useToast();

  const handleGenerate = async () => {
    try {
      await generatePack.mutateAsync();
      toast({ title: 'Filing pack generated' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const summaryJson = pack?.summaryJson ? JSON.parse(pack.summaryJson) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(summaryJson, null, 2));
    toast({ title: 'Copied to clipboard' });
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(summaryJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filing-pack-${selectedTaxYear}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Filing Pack</h1>
          <p className="text-muted-foreground">Your tax filing summary for {selectedTaxYear}</p>
        </div>
        <Button onClick={handleGenerate} disabled={generatePack.isPending}>
          {generatePack.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Generate Filing Pack
        </Button>
      </div>

      {pack ? (
        <>
          <div className="flex items-center gap-3">
            <Badge variant={pack.status === 'Ready' ? 'default' : 'secondary'}>{pack.status}</Badge>
            <span className="text-sm text-muted-foreground">
              Generated: {new Date(pack.generatedAt).toLocaleString()}
            </span>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Summary</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <JsonViewer data={summaryJson} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              No filing pack yet. Generate one after computing your tax.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
