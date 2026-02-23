import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useIncome, useAddIncome, useDeleteIncome } from '@/hooks/useIncome';
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
import { Plus, Trash2, Wallet } from 'lucide-react';

const INCOME_TYPES = ['Employment', 'Freelance', 'Business', 'Crypto', 'Investment', 'Rental', 'Other'] as const;
const FREQUENCIES = ['OneOff', 'Monthly', 'Annual'] as const;

const incomeSchema = z.object({
  type: z.enum(INCOME_TYPES),
  amount: z.coerce.number().positive('Amount must be positive'),
  frequency: z.enum(FREQUENCIES),
  metadataJson: z.string().optional(),
});

type IncomeForm = z.infer<typeof incomeSchema>;

export default function Income() {
  const { data: records = [] } = useIncome();
  const addIncome = useAddIncome();
  const deleteIncome = useDeleteIncome();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { type: 'Employment', amount: 0, frequency: 'Monthly', metadataJson: '' },
  });

  const onSubmit = async (data: IncomeForm) => {
    try {
      await addIncome.mutateAsync({ type: data.type, amount: data.amount, frequency: data.frequency, metadataJson: data.metadataJson || '' });
      toast({ title: 'Income added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error adding income', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteIncome.mutateAsync(deleteId);
      toast({ title: 'Income deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Income Records</h1>
          <p className="text-muted-foreground">Manage your income sources for the tax year</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Income</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Income Record</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {INCOME_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                <FormField control={form.control} name="frequency" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="metadataJson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea placeholder="Additional details..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addIncome.isPending}>
                  {addIncome.isPending ? 'Adding...' : 'Add Income'}
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
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No income records yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Add your first income record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="hidden sm:table-cell">Frequency</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.type}</TableCell>
                    <TableCell>{formatNaira(record.amount)}</TableCell>
                    <TableCell className="hidden sm:table-cell">{record.frequency}</TableCell>
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
        title="Delete Income Record"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
