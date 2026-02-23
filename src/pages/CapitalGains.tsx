import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCapitalGains, useAddCapitalGain, useDeleteCapitalGain } from '@/hooks/useCapitalGains';
import { useToast } from '@/hooks/use-toast';
import { formatNaira, formatDate } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, TrendingUp } from 'lucide-react';

const ASSET_TYPES = ['Crypto', 'Stock', 'Property', 'Other'] as const;

const gainSchema = z.object({
  assetType: z.enum(ASSET_TYPES),
  proceeds: z.coerce.number().positive('Must be positive'),
  costBasis: z.coerce.number().min(0),
  fees: z.coerce.number().min(0),
  realizedAt: z.string().min(1, 'Required'),
});

type GainForm = z.infer<typeof gainSchema>;

export default function CapitalGains() {
  const { data: records = [] } = useCapitalGains();
  const addGain = useAddCapitalGain();
  const deleteGain = useDeleteCapitalGain();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<GainForm>({
    resolver: zodResolver(gainSchema),
    defaultValues: { assetType: 'Crypto', proceeds: 0, costBasis: 0, fees: 0, realizedAt: '' },
  });

  const onSubmit = async (data: GainForm) => {
    try {
      await addGain.mutateAsync({ assetType: data.assetType, proceeds: data.proceeds, costBasis: data.costBasis, fees: data.fees, realizedAt: data.realizedAt });
      toast({ title: 'Capital gain added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGain.mutateAsync(deleteId);
      toast({ title: 'Record deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Capital Gains</h1>
          <p className="text-muted-foreground">Track your capital gains and losses</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Gain</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Capital Gain</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="assetType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ASSET_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="proceeds" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proceeds (₦)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="costBasis" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Basis (₦)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="fees" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fees (₦)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="realizedAt" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Realized Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full" disabled={addGain.isPending}>
                  {addGain.isPending ? 'Adding...' : 'Add Capital Gain'}
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
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No capital gain records yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Add your first record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Proceeds</TableHead>
                  <TableHead className="hidden sm:table-cell">Cost Basis</TableHead>
                  <TableHead className="hidden md:table-cell">Gain/Loss</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const gain = record.proceeds - record.costBasis - record.fees;
                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.assetType}</TableCell>
                      <TableCell>{formatNaira(record.proceeds)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatNaira(record.costBasis)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className={gain >= 0 ? 'text-primary' : 'text-destructive'}>
                          {formatNaira(gain)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{formatDate(record.realizedAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(record.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Capital Gain Record"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
