import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCapitalAllowances, useAddCapitalAllowance, useDeleteCapitalAllowance } from '@/hooks/useCapitalAllowances';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, Calculator, ArrowLeft } from 'lucide-react';

const allowanceSchema = z.object({
  assetDescription: z.string().min(1, 'Required').max(200),
  cost: z.coerce.number().positive('Must be positive'),
  ratePercent: z.coerce.number().min(0).max(100, 'Max 100%'),
  allowanceAmount: z.coerce.number().min(0),
  yearAcquired: z.coerce.number().int().min(1900).max(2100).nullable().optional(),
});

type AllowanceForm = z.infer<typeof allowanceSchema>;

export default function CapitalAllowances() {
  const { data: records = [] } = useCapitalAllowances();
  const addAllowance = useAddCapitalAllowance();
  const deleteAllowance = useDeleteCapitalAllowance();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AllowanceForm>({
    resolver: zodResolver(allowanceSchema),
    defaultValues: { assetDescription: '', cost: 0, ratePercent: 0, allowanceAmount: 0, yearAcquired: null },
  });

  // Auto-calculate allowance when cost or rate changes
  const watchCost = form.watch('cost');
  const watchRate = form.watch('ratePercent');

  const onSubmit = async (data: AllowanceForm) => {
    try {
      await addAllowance.mutateAsync({
        assetDescription: data.assetDescription,
        cost: data.cost,
        ratePercent: data.ratePercent,
        allowanceAmount: data.allowanceAmount || (data.cost * data.ratePercent / 100),
        yearAcquired: data.yearAcquired ?? null,
      });
      toast({ title: 'Capital allowance added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAllowance.mutateAsync(deleteId);
      toast({ title: 'Allowance deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const total = records.reduce((s, r) => s + r.allowanceAmount, 0);

  return (
    <div className="space-y-6">
      <Link to="/app/manual" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Manual Mode
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Capital Allowances</h1>
          <p className="text-muted-foreground">Claim depreciation on business assets (Form A — Part E)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Allowance</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Capital Allowance</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="assetDescription" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Description</FormLabel>
                    <FormControl><Input placeholder="e.g. Office Computer" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="cost" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₦)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="ratePercent" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (%)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                      <FormDescription>e.g. 25 for 25%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="allowanceAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Allowance Amount (₦)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value || (watchCost * watchRate / 100) || 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Auto-calculated from cost × rate, or override manually</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="yearAcquired" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Acquired</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g. 2024"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addAllowance.isPending}>
                  {addAllowance.isPending ? 'Adding...' : 'Add Allowance'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No capital allowances yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Add your first allowance
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Rate</TableHead>
                  <TableHead className="text-right">Allowance</TableHead>
                  <TableHead className="hidden md:table-cell">Year</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{r.assetDescription}</TableCell>
                    <TableCell className="text-right font-mono">{formatNaira(r.cost)}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{r.ratePercent}%</TableCell>
                    <TableCell className="text-right font-mono">{formatNaira(r.allowanceAmount)}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.yearAcquired ?? '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={3}>Total Allowances</TableCell>
                  <TableCell className="text-right font-mono">{formatNaira(total)}</TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Allowance"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
