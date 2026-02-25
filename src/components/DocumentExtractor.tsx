import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAddIncome } from '@/hooks/useIncome';
import { useAddDeduction } from '@/hooks/useDeductions';
import { useAddCapitalGain } from '@/hooks/useCapitalGains';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNaira } from '@/lib/format';
import { Loader2, Sparkles, Check, AlertTriangle, FileSearch, X } from 'lucide-react';
import type { IncomeType, Frequency } from '@/types/tax';

interface ExtractedItem {
  category: 'income' | 'deduction' | 'capital_gain';
  subType: string;
  amount: number;
  description: string;
  date: string;
  confidence: number;
  selected: boolean;
}

interface ExtractionResult {
  documentType: string;
  summary: string;
  items: ExtractedItem[];
  currency: string;
  period: string | null;
}

interface DocumentExtractorProps {
  documentId: string;
  filePath: string;
  fileName: string;
  fileType: string | null;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  income: 'Income',
  deduction: 'Deduction',
  capital_gain: 'Capital Gain',
};

const CATEGORY_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  income: 'default',
  deduction: 'secondary',
  capital_gain: 'outline',
};

export function DocumentExtractor({ documentId, filePath, fileName, fileType, onClose }: DocumentExtractorProps) {
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const { toast } = useToast();
  const addIncome = useAddIncome();
  const addDeduction = useAddDeduction();
  const addGain = useAddCapitalGain();

  const handleExtract = async () => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-document-data', {
        body: { filePath, fileName, fileType },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const extracted: ExtractionResult = {
        ...data,
        items: (data.items || []).map((item: any) => ({
          ...item,
          selected: item.confidence >= 0.5,
        })),
      };

      setResult(extracted);
      setItems(extracted.items);
      toast({ title: `Found ${extracted.items.length} items in ${extracted.documentType}` });
    } catch (err: any) {
      toast({ title: 'Extraction failed', description: err.message, variant: 'destructive' });
    } finally {
      setExtracting(false);
    }
  };

  const toggleItem = (i: number) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, selected: !item.selected } : item));
  };

  const updateCategory = (i: number, category: ExtractedItem['category']) => {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, category } : item));
  };

  const handleImport = async () => {
    setImporting(true);
    const selected = items.filter(i => i.selected);
    let count = 0;

    for (const item of selected) {
      try {
        if (item.category === 'income') {
          await addIncome.mutateAsync({
            type: (item.subType || 'Other') as IncomeType,
            amount: item.amount,
            frequency: 'Annual' as Frequency,
            metadataJson: `${item.description} (extracted from ${fileName})`,
          });
          count++;
        } else if (item.category === 'deduction') {
          await addDeduction.mutateAsync({
            type: item.subType || 'Other',
            amount: item.amount,
            description: `${item.description} (extracted from ${fileName})`,
          });
          count++;
        } else if (item.category === 'capital_gain') {
          await addGain.mutateAsync({
            assetType: (item.subType || 'Other') as any,
            proceeds: item.amount,
            costBasis: 0,
            fees: 0,
            realizedAt: item.date || new Date().toISOString().split('T')[0],
          });
          count++;
        }
      } catch {
        /* continue */
      }
    }

    setImporting(false);
    setImported(true);

    // Update document status
    await supabase.from('documents').update({ status: 'extracted' }).eq('id', documentId);

    toast({ title: `Imported ${count} records from ${fileName}` });
  };

  const selectedCount = items.filter(i => i.selected).length;

  // Initial state — prompt to extract
  if (!result && !extracting) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSearch className="h-5 w-5 text-primary" />
            AI Document Scanner
          </CardTitle>
          <CardDescription>
            Extract income, deductions, and capital gains from <strong>{fileName}</strong> using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button onClick={handleExtract}>
            <Sparkles className="h-4 w-4 mr-2" />
            Scan Document
          </Button>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
        </CardContent>
      </Card>
    );
  }

  // Extracting state
  if (extracting) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-10 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-medium">Scanning {fileName}...</p>
          <p className="text-sm text-muted-foreground mt-1">AI is reading and extracting financial data</p>
        </CardContent>
      </Card>
    );
  }

  // Results
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              Extraction Results
            </CardTitle>
            <CardDescription className="mt-1">
              {result?.summary} • {result?.documentType} {result?.period ? `• ${result.period}` : ''}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-muted-foreground">No extractable financial data found in this document.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-opacity ${
                    item.selected ? 'bg-background' : 'opacity-40 bg-muted/30'
                  }`}
                >
                  <Checkbox
                    checked={item.selected}
                    onCheckedChange={() => toggleItem(i)}
                    className="mt-1"
                    disabled={imported}
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Select
                        value={item.category}
                        onValueChange={(v) => updateCategory(i, v as ExtractedItem['category'])}
                        disabled={imported}
                      >
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="deduction">Deduction</SelectItem>
                          <SelectItem value="capital_gain">Capital Gain</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="outline" className="text-[10px]">{item.subType}</Badge>
                      {item.confidence < 0.7 && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <AlertTriangle className="h-2.5 w-2.5" /> Low confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm truncate">{item.description}</p>
                    {item.date && <p className="text-xs text-muted-foreground">{item.date}</p>}
                  </div>
                  <span className="font-mono font-semibold text-sm whitespace-nowrap">
                    {formatNaira(item.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">{selectedCount} of {items.length} items selected</p>
              <Button onClick={handleImport} disabled={importing || imported || selectedCount === 0}>
                {imported ? (
                  <><Check className="h-4 w-4 mr-2" /> Imported</>
                ) : importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" /> Import {selectedCount} Records</>
                )}
              </Button>
            </div>

            {!imported && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <p>Review each item before importing. You can change categories and uncheck items you don't want. Capital gains will need cost basis adjusted manually after import.</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
