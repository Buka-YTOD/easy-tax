import { useState, useCallback } from 'react';
import { useAddIncome } from '@/hooks/useIncome';
import { useAddDeduction } from '@/hooks/useDeductions';
import { useAddCapitalGain } from '@/hooks/useCapitalGains';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Check, Loader2, AlertCircle } from 'lucide-react';
import type { IncomeType, Frequency } from '@/types/tax';

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  category: 'income' | 'deduction' | 'capital_gain' | 'skip';
  subType: string;
  selected: boolean;
}

function categorizeTransaction(desc: string, amount: number): { category: ParsedRow['category']; subType: string } {
  const d = desc.toLowerCase();
  if (d.includes('salary') || d.includes('payroll') || d.includes('wage')) return { category: 'income', subType: 'Employment' };
  if (d.includes('freelance') || d.includes('invoice') || d.includes('consulting')) return { category: 'income', subType: 'Freelance' };
  if (d.includes('rent received') || d.includes('rental income')) return { category: 'income', subType: 'Rental' };
  if (d.includes('dividend') || d.includes('interest') || d.includes('investment')) return { category: 'income', subType: 'Investment' };
  if (d.includes('crypto') || d.includes('bitcoin') || d.includes('binance')) return { category: 'capital_gain', subType: 'Crypto' };
  if (d.includes('stock') || d.includes('shares') || d.includes('trading')) return { category: 'capital_gain', subType: 'Stock' };
  if (d.includes('pension') || d.includes('nhf') || d.includes('retirement')) return { category: 'deduction', subType: 'Pension' };
  if (d.includes('health') || d.includes('hmo') || d.includes('insurance')) return { category: 'deduction', subType: 'Health Insurance' };
  if (d.includes('donation') || d.includes('charity') || d.includes('tithe')) return { category: 'deduction', subType: 'Charitable Donation' };
  if (d.includes('mortgage') || d.includes('housing')) return { category: 'deduction', subType: 'Mortgage Interest' };
  if (d.includes('school') || d.includes('tuition') || d.includes('education')) return { category: 'deduction', subType: 'Education' };
  if (amount > 0) return { category: 'income', subType: 'Other' };
  return { category: 'skip', subType: '' };
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  const header = lines[0].toLowerCase();
  const cols = header.split(',').map(c => c.trim().replace(/"/g, ''));
  
  const dateIdx = cols.findIndex(c => c.includes('date'));
  const descIdx = cols.findIndex(c => c.includes('desc') || c.includes('narration') || c.includes('particular') || c.includes('memo'));
  const amountIdx = cols.findIndex(c => c.includes('amount') || c.includes('credit') || c.includes('value'));
  const debitIdx = cols.findIndex(c => c.includes('debit') || c.includes('withdrawal'));
  const creditIdx = cols.findIndex(c => c === 'credit' || c.includes('deposit'));

  return lines.slice(1).map(line => {
    const parts = line.split(',').map(c => c.trim().replace(/"/g, ''));
    const date = dateIdx >= 0 ? parts[dateIdx] || '' : '';
    const description = descIdx >= 0 ? parts[descIdx] || '' : parts[1] || '';
    
    let amount = 0;
    if (creditIdx >= 0 && debitIdx >= 0) {
      const credit = parseFloat(parts[creditIdx]) || 0;
      const debit = parseFloat(parts[debitIdx]) || 0;
      amount = credit > 0 ? credit : -debit;
    } else if (amountIdx >= 0) {
      amount = parseFloat(parts[amountIdx]) || 0;
    }

    const { category, subType } = categorizeTransaction(description, amount);
    return { date, description, amount: Math.abs(amount), category, subType, selected: category !== 'skip' };
  }).filter(r => r.amount > 0);
}

const CATEGORY_COLORS: Record<string, string> = {
  income: 'default',
  deduction: 'secondary',
  capital_gain: 'outline',
  skip: 'destructive',
};

export default function ImportData() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const addIncome = useAddIncome();
  const addDeduction = useAddDeduction();
  const addGain = useAddCapitalGain();
  const { toast } = useToast();

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setImported(false);
      toast({ title: `Parsed ${parsed.length} transactions` });
    };
    reader.readAsText(file);
  }, [toast]);

  const toggleRow = (i: number) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r));
  };

  const updateCategory = (i: number, category: ParsedRow['category']) => {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, category } : r));
  };

  const handleImport = async () => {
    setImporting(true);
    const selected = rows.filter(r => r.selected && r.category !== 'skip');
    let count = 0;

    for (const row of selected) {
      try {
        if (row.category === 'income') {
          await addIncome.mutateAsync({ type: row.subType as IncomeType, amount: row.amount, frequency: 'OneOff' as Frequency, metadataJson: row.description });
          count++;
        } else if (row.category === 'deduction') {
          await addDeduction.mutateAsync({ type: row.subType, amount: row.amount, description: row.description });
          count++;
        } else if (row.category === 'capital_gain') {
          await addGain.mutateAsync({ assetType: row.subType as any, proceeds: row.amount, costBasis: 0, fees: 0, realizedAt: row.date || new Date().toISOString().split('T')[0] });
          count++;
        }
      } catch { /* continue */ }
    }

    setImporting(false);
    setImported(true);
    toast({ title: `Imported ${count} records successfully` });
  };

  const selectedCount = rows.filter(r => r.selected && r.category !== 'skip').length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">Upload a bank statement or CSV to auto-categorize transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV File</CardTitle>
          <CardDescription>
            Supported formats: bank statement CSV with columns for date, description, and amount.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-sm text-muted-foreground">Click to upload CSV file</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Parsed Transactions ({rows.length})</CardTitle>
                <CardDescription>{selectedCount} selected for import</CardDescription>
              </div>
              <Button onClick={handleImport} disabled={importing || imported || selectedCount === 0}>
                {imported ? (
                  <><Check className="h-4 w-4 mr-2" /> Imported</>
                ) : importing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" /> Import {selectedCount} Records</>
                )}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Use</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="hidden md:table-cell">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i} className={!row.selected ? 'opacity-40' : ''}>
                        <TableCell>
                          <input type="checkbox" checked={row.selected} onChange={() => toggleRow(i)} className="rounded" />
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">{row.description}</TableCell>
                        <TableCell className="font-medium">₦{row.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Select value={row.category} onValueChange={(v) => updateCategory(i, v as ParsedRow['category'])}>
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Income</SelectItem>
                              <SelectItem value="deduction">Deduction</SelectItem>
                              <SelectItem value="capital_gain">Cap. Gain</SelectItem>
                              <SelectItem value="skip">Skip</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{row.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Review categories before importing. You can change any transaction's category using the dropdown. Capital gains will need cost basis adjusted manually after import.</p>
          </div>
        </>
      )}
    </div>
  );
}
