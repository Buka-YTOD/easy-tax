import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useTaxProfile, useUpdateTaxProfile } from '@/hooks/useTaxProfile';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  tin: z.string().max(20).optional(),
  isResident: z.boolean(),
  // Extended personal particulars
  maritalStatus: z.string().max(20).optional(),
  spouseName: z.string().max(100).optional(),
  numChildren: z.coerce.number().int().min(0).max(50).optional(),
  dateOfBirth: z.date().nullable().optional(),
  sex: z.string().max(10).optional(),
  occupation: z.string().max(100).optional(),
  residentialAddress: z.string().max(300).optional(),
  lga: z.string().max(100).optional(),
  employerName: z.string().max(200).optional(),
  employerAddress: z.string().max(300).optional(),
  employerTin: z.string().max(20).optional(),
});

type TaxProfileForm = z.infer<typeof taxProfileSchema>;

export default function TaxProfile() {
  const { selectedTaxYear } = useAppContext();
  const { data: profile, isLoading } = useTaxProfile();
  const updateProfile = useUpdateTaxProfile();
  const { toast } = useToast();

  const form = useForm<TaxProfileForm>({
    resolver: zodResolver(taxProfileSchema),
    defaultValues: {
      filingType: 'Individual', stateOfResidence: '', tin: '', isResident: true,
      maritalStatus: 'Single', spouseName: '', numChildren: 0, dateOfBirth: null,
      sex: '', occupation: '', residentialAddress: '', lga: '',
      employerName: '', employerAddress: '', employerTin: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        filingType: profile.filingType,
        stateOfResidence: profile.stateOfResidence,
        tin: profile.tin || '',
        isResident: profile.isResident,
        maritalStatus: profile.maritalStatus || 'Single',
        spouseName: profile.spouseName || '',
        numChildren: profile.numChildren ?? 0,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        sex: profile.sex || '',
        occupation: profile.occupation || '',
        residentialAddress: profile.residentialAddress || '',
        lga: profile.lga || '',
        employerName: profile.employerName || '',
        employerAddress: profile.employerAddress || '',
        employerTin: profile.employerTin || '',
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: TaxProfileForm) => {
    try {
      await updateProfile.mutateAsync({
        ...profile,
        ...data,
        dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : null,
      });
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
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tax Profile</h1>
        <p className="text-muted-foreground">Configure your tax filing profile for {selectedTaxYear}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Filing basics */}
          <Card>
            <CardHeader>
              <CardTitle>Filing Details</CardTitle>
              <CardDescription>Tax Year: {selectedTaxYear}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <FormLabel>TIN</FormLabel>
                  <FormControl><Input placeholder="Tax Identification Number" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isResident" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="mb-0">Nigerian Resident</FormLabel>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Personal Particulars */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Particulars</CardTitle>
              <CardDescription>Required for Form A — Part A</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="sex" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sex</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date of Birth</FormLabel>
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
                        disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="maritalStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marital Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'Single'}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                      <SelectItem value="Widowed">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="spouseName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Spouse Name</FormLabel>
                  <FormControl><Input placeholder="Full name of spouse" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="numChildren" render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Children</FormLabel>
                  <FormControl><Input type="number" min={0} max={50} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="occupation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Occupation / Profession</FormLabel>
                  <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="residentialAddress" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Residential Address</FormLabel>
                  <FormControl><Input placeholder="Full residential address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="lga" render={({ field }) => (
                <FormItem>
                  <FormLabel>Local Government Area (LGA)</FormLabel>
                  <FormControl><Input placeholder="e.g. Ikeja" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* Employer Details */}
          <Card>
            <CardHeader>
              <CardTitle>Employer Information</CardTitle>
              <CardDescription>Leave blank if self-employed</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="employerName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer Name</FormLabel>
                  <FormControl><Input placeholder="Company name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="employerTin" render={({ field }) => (
                <FormItem>
                  <FormLabel>Employer TIN</FormLabel>
                  <FormControl><Input placeholder="Employer's TIN" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="employerAddress" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Employer Address</FormLabel>
                  <FormControl><Input placeholder="Full employer address" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Button type="submit" size="lg" disabled={updateProfile.isPending} className="w-full sm:w-auto">
            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
