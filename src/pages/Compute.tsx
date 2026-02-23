import { Link } from 'react-router-dom';
import { useComputation, useComputeTax } from '@/hooks/useComputation';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, ArrowRight, Loader2 } from 'lucide-react';

export default function Compute() {
  const { selectedTaxYear } = useAppContext();
  const { data: computation } = useComputation();
  const computeTax = useComputeTax();
  const { toast } = useToast();

  const handleCompute = async () => {
    try {
      await computeTax.mutateAsync();
      toast({ title: 'Tax computed successfully' });
    } catch {
      toast({ title: 'Error computing tax', variant: 'destructive' });
    }
  };

  const breakdown = computation?.breakdownJson ? JSON.parse(computation.breakdownJson) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tax Computation</h1>
          <p className="text-muted-foreground">Calculate your tax liability for {selectedTaxYear}</p>
        </div>
        <Button onClick={handleCompute} disabled={computeTax.isPending}>
          {computeTax.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Calculator className="h-4 w-4 mr-2" />
          )}
          Compute Tax
        </Button>
      </div>

      {computation ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold">{formatNaira(computation.totalIncome)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Taxable Income</p>
                <p className="text-2xl font-bold">{formatNaira(computation.taxableIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Tax Owed</p>
                <p className="text-2xl font-bold text-primary">{formatNaira(computation.taxOwed)}</p>
              </CardContent>
            </Card>
          </div>

          {breakdown?.brackets && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tax Bracket Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bracket</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Taxable Amount</TableHead>
                      <TableHead>Tax</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {breakdown.brackets.map((b: { bracket: string; rate: number; taxableAmount: number; tax: number }, i: number) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{b.bracket}</TableCell>
                        <TableCell>{(b.rate * 100).toFixed(0)}%</TableCell>
                        <TableCell>{formatNaira(b.taxableAmount)}</TableCell>
                        <TableCell>{formatNaira(b.tax)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Last computed: {new Date(computation.computedAt).toLocaleString()}
            </p>
            <Link to="/app/filing-pack">
              <Button variant="outline">
                Generate Filing Pack <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">
              No computation yet. Add income records and click "Compute Tax" to calculate.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
