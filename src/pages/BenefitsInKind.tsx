import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useBenefitsInKind, useAddBenefitInKind, useDeleteBenefitInKind } from '@/hooks/useBenefitsInKind';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, Gift, ArrowLeft } from 'lucide-react';

const BIK_CATEGORIES = [
  'Accommodation', 'Motor Vehicle', 'Utilities', 'Domestic Staff',
  'Entertainment', 'Furniture & Fittings', 'Meals / Food', 'Telephone', 'Other',
] as const;

const bikSchema = z.object({
  category: z.string().min(1, 'Required'),
  description: z.string().max(300).optional(),
  annualValue: z.coerce.number().positive('Must be positive'),
});

type BIKForm = z.infer<typeof bikSchema>;

export default function BenefitsInKind() {
  const { data: records = [] } = useBenefitsInKind();
  const addBIK = useAddBenefitInKind();
  const deleteBIK = useDeleteBenefitInKind();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<BIKForm>({
    resolver: zodResolver(bikSchema),
    defaultValues: { category: 'Other', description: '', annualValue: 0 },
  });

  const onSubmit = async (data: BIKForm) => {
    try {
      await addBIK.mutateAsync({ category: data.category, description: data.description || null, annualValue: data.annualValue });
      toast({ title: 'Benefit added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBIK.mutateAsync(deleteId);
      toast({ title: 'Benefit deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  const total = records.reduce((s, r) => s + r.annualValue, 0);

  return (
    <div className="space-y-6">
      <Link to="/app/manual" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Manual Mode
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benefits in Kind</h1>
          <p className="text-muted-foreground">Non-cash benefits from employer (Form A — Part C)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Benefit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Benefit in Kind</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {BIK_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="annualValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Annual Value (₦)</FormLabel>
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
                <Button type="submit" className="w-full" disabled={addBIK.isPending}>
                  {addBIK.isPending ? 'Adding...' : 'Add Benefit'}
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
              <Gift className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No benefits in kind yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Add your first benefit
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="text-right">Annual Value</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[200px] truncate">{r.description || '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatNaira(r.annualValue)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right font-mono">{formatNaira(total)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Benefit"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
