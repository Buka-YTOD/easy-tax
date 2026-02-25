import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useAssetDeclarations, useAddAssetDeclaration, useDeleteAssetDeclaration } from '@/hooks/useAssetDeclarations';
import { useToast } from '@/hooks/use-toast';
import { formatNaira } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Plus, Trash2, Landmark, ArrowLeft } from 'lucide-react';

const ASSET_TYPES = ['Property', 'Motor Vehicle', 'Shares / Stocks', 'Crypto', 'Land', 'Equipment', 'Other'] as const;

const assetSchema = z.object({
  assetType: z.string().min(1, 'Required'),
  description: z.string().max(300).optional(),
  location: z.string().max(200).optional(),
  dateAcquired: z.date().nullable().optional(),
  cost: z.coerce.number().min(0, 'Must be non-negative'),
  currentValue: z.coerce.number().min(0, 'Must be non-negative'),
});

type AssetForm = z.infer<typeof assetSchema>;

export default function AssetDeclarations() {
  const { data: records = [] } = useAssetDeclarations();
  const addAsset = useAddAssetDeclaration();
  const deleteAsset = useDeleteAssetDeclaration();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<AssetForm>({
    resolver: zodResolver(assetSchema),
    defaultValues: { assetType: 'Other', description: '', location: '', dateAcquired: null, cost: 0, currentValue: 0 },
  });

  const onSubmit = async (data: AssetForm) => {
    try {
      await addAsset.mutateAsync({
        assetType: data.assetType,
        description: data.description || null,
        location: data.location || '',
        dateAcquired: data.dateAcquired ? format(data.dateAcquired, 'yyyy-MM-dd') : null,
        cost: data.cost,
        currentValue: data.currentValue,
      });
      toast({ title: 'Asset added' });
      form.reset();
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAsset.mutateAsync(deleteId);
      toast({ title: 'Asset deleted' });
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <Link to="/app/manual" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2">
        <ArrowLeft className="h-4 w-4" /> Back to Manual Mode
      </Link>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Asset Declarations</h1>
          <p className="text-muted-foreground">Declare owned assets (Form A — Part D)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Asset</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Asset Declaration</DialogTitle></DialogHeader>
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
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Details about the asset..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input placeholder="e.g. Lagos, Nigeria" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="dateAcquired" render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date Acquired</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
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
                  <FormField control={form.control} name="currentValue" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Value (₦)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <Button type="submit" className="w-full" disabled={addAsset.isPending}>
                  {addAsset.isPending ? 'Adding...' : 'Add Asset'}
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
              <Landmark className="h-12 w-12 mx-auto text-muted-foreground/30" />
              <p className="mt-4 text-muted-foreground">No assets declared yet</p>
              <Button variant="link" onClick={() => setDialogOpen(true)} className="mt-2">
                Declare your first asset
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Current Value</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.assetType}</TableCell>
                    <TableCell className="hidden sm:table-cell max-w-[150px] truncate">{r.description || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell">{r.location || '—'}</TableCell>
                    <TableCell className="text-right font-mono">{formatNaira(r.cost)}</TableCell>
                    <TableCell className="text-right font-mono">{formatNaira(r.currentValue)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
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
        title="Delete Asset"
        description="Are you sure? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
