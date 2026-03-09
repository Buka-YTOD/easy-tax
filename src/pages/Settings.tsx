import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, User, MapPin } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTaxProfile, useUpdateTaxProfile } from '@/hooks/useTaxProfile';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SUPPORTED_STATES = ['Lagos', 'FCT Abuja', 'Rivers'] as const;

const settingsSchema = z.object({
  filingType: z.enum(['Individual', 'Business']),
  tin: z.string().optional(),
  isResident: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { selectedTaxYear, setSelectedTaxYear, profile: userProfile, user } = useAppContext();
  const { data: profile, isLoading } = useTaxProfile();
  const updateProfile = useUpdateTaxProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState(userProfile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phone_number || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.full_name || '');
      setPhoneNumber(userProfile.phone_number || '');
    }
  }, [userProfile]);

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { filingType: 'Individual', tin: '', isResident: true },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        filingType: profile.filingType,
        tin: profile.tin || '',
        isResident: profile.isResident,
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: SettingsForm) => {
    try {
      // Spread existing profile to preserve extended fields
      await updateProfile.mutateAsync({ ...profile, ...data });
      toast({ title: 'Settings saved!' });
    } catch {
      toast({ title: 'Error saving', variant: 'destructive' });
    }
  };

  const handleProfileSave = async () => {
    if (!user) return;
    setProfileSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, phone_number: phoneNumber || null })
        .eq('user_id', user.id);
      if (error) throw error;
      toast({ title: 'Profile updated!' });
    } catch {
      toast({ title: 'Error updating profile', variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Image too large (max 2MB)', variant: 'destructive' });
      return;
    }
    setAvatarUploading(true);
    try {
      const filePath = `${user.id}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: dbErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (dbErr) throw dbErr;

      toast({ title: 'Profile photo updated!' });
      window.location.reload();
    } catch {
      toast({ title: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setAvatarUploading(false);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-48" /><div className="h-64 bg-muted rounded" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your tax year and profile</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Your Profile
          </CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="relative group">
              <Avatar className="h-14 w-14">
                <AvatarImage src={userProfile?.avatar_url || undefined} alt={fullName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg font-medium">
                  {fullName?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[10px] text-white font-medium">{avatarUploading ? '...' : 'Edit'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
            </div>
            <div>
              <p className="font-medium">{fullName || 'No name set'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+234..." />
          </div>
          <Button onClick={handleProfileSave} disabled={profileSaving}>
            {profileSaving ? 'Saving...' : 'Update Profile'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Year</CardTitle>
          <CardDescription>Select the year you're filing for</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={String(selectedTaxYear)} onValueChange={(v) => setSelectedTaxYear(Number(v))}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>TY {y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Profile</CardTitle>
          <CardDescription>Your basic filing information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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

              <FormItem>
                <FormLabel>State of Residence</FormLabel>
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-muted text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{userProfile?.state || 'Not set'}</span>
                </div>
                <p className="text-xs text-muted-foreground">Set during sign-up. Contact support to change.</p>
              </FormItem>

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
                    <p className="text-sm text-muted-foreground">Are you a tax resident?</p>
                  </div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )} />

              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Next step CTA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Next: Start the Guided Interview</p>
            <p className="text-sm text-muted-foreground">Let our AI walk you through your tax filing step by step.</p>
          </div>
          <Link to="/app/guided">
            <Button>
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
