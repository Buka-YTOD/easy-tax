import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDeductions, useAddDeduction, useDeleteDeduction } from '@/hooks/useDeductions';
import { useToast } from '@/hooks/use-toast';
import { formatNaira, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, Receipt } from 'lucide-react';

const DEDUCTION_TYPES = ['Pension', 'Health Insurance', 'Mortgage Interest', 'Charitable Donation', 'Education', 'Other'] as const;

const deductionSchema = z.object({
  type: z.string().min(1),
  amount: z.coerce.number().positive('Must be positive'),
  description: z.string().optional(),
});

type DeductionForm = z.infer<typeof deductionSchema>;

export default function Deductions() {
  const { data: records = [] } = useDeductions();
  const addDeduction = useAddDeduction();
  const deleteDeduction = useDeleteDeduction();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<DeductionForm>({
    resolver: zodResolver(deductionSchema),
    defaultValues: { type: 'Pension', amount: 0, description: '' },
  });

  const onSubmit = async (data: DeductionForm) => {
    try {
      await addDeduction.mutateAsync({ type: data.type, amount: data.amount, description: data.description || '' });
      toast({ title: 'Deduction added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDeduction.mutateAsync(deleteId);
      toast({ title: 'Deduction deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deductions</h1>
          <p className="text-muted-foreground">Manage your tax deductions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Deduction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Deduction</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {DEDUCTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₦)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Details..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addDeduction.isPending}>
                  {addDeduction.isPending ? 'Adding...' : 'Add Deduction'}
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
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No deductions yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Add your first deduction
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.type}</TableCell>
                    <TableCell>{formatNaira(record.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{record.description}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(record.createdAt)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(record.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Deduction"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
