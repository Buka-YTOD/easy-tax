import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaxProfile, useUpdateTaxProfile } from '@/hooks/useTaxProfile';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

const taxProfileSchema = z.object({
  filingType: z.enum(['Individual', 'Business']),
  stateOfResidence: z.string().min(1, 'Required'),
  tin: z.string().optional(),
  isResident: z.boolean(),
});

type TaxProfileForm = z.infer<typeof taxProfileSchema>;

export default function TaxProfile() {
  const { selectedTaxYear } = useAppContext();
  const { data: profile, isLoading } = useTaxProfile();
  const updateProfile = useUpdateTaxProfile();
  const { toast } = useToast();

  const form = useForm<TaxProfileForm>({
    resolver: zodResolver(taxProfileSchema),
    defaultValues: { filingType: 'Individual', stateOfResidence: '', tin: '', isResident: true },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        filingType: profile.filingType,
        stateOfResidence: profile.stateOfResidence,
        tin: profile.tin || '',
        isResident: profile.isResident,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: TaxProfileForm) => {
    try {
      await updateProfile.mutateAsync(data);
      toast({ title: 'Profile saved', description: 'Your tax profile has been updated.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to save profile.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-64 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Profile</h1>
        <p className="text-muted-foreground">Configure your tax filing profile for {selectedTaxYear}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Tax Year: {selectedTaxYear} (read-only)</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="filingType" render={({ field }) => (
                <FormItem>
                  <FormLabel>Filing Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="stateOfResidence" render={({ field }) => (
                <FormItem>
                  <FormLabel>State of Residence</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {NIGERIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tin" render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN (Optional)</FormLabel>
                  <FormControl><Input placeholder="Tax Identification Number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isResident" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel className="mb-0">Nigerian Resident</FormLabel>
                    <p className="text-sm text-muted-foreground">Are you a tax resident of Nigeria?</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
