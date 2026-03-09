import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Shield, Brain, FileCheck, Loader2, MapPin, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_STATES = ['Lagos', 'FCT Abuja', 'Rivers'] as const;

const ALL_NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

export default function Login() {
  const { isAuthenticated, isLoading: appLoading } = useAppContext();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app/home" replace />;
  }

  const handleStateChange = (value: string) => {
    setSelectedState(value);
    const isSupported = (SUPPORTED_STATES as readonly string[]).includes(value);
    setShowWaitlist(!isSupported);
  };

  const subscribeToNewsletter = async (subscriberEmail: string, name?: string) => {
    try {
      const [first_name, ...rest] = (name || '').split(' ');
      const last_name = rest.join(' ');
      await supabase.functions.invoke('subscribe-newsletter', {
        body: { email: subscriberEmail, first_name, last_name, state: selectedState },
      });
    } catch (err) {
      console.error('Newsletter subscribe failed:', err);
    }
  };

  const handleWaitlistSubmit = async () => {
    if (!waitlistEmail) return;
    await subscribeToNewsletter(waitlistEmail);
    toast({ title: 'You\'re on the list! 🎉', description: `We'll notify you when TaxWise is available in ${selectedState}.` });
    setWaitlistSubmitted(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      if (!selectedState || showWaitlist) {
        toast({ title: 'Please select a supported state', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, state: selectedState },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
        if (data.user) {
          await supabase.from('profiles').update({ state: selectedState }).eq('user_id', data.user.id);
          subscribeToNewsletter(email, fullName);
        }
        toast({ title: 'Check your email', description: 'We sent you a confirmation link to verify your account.' });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-primary-foreground">TaxWise</h1>
          <p className="text-primary-foreground/70 mt-1">AI-Powered Tax Filing for Nigeria</p>
        </div>
        <div className="space-y-8">
          <Feature icon={Brain} title="AI-Powered Classification" desc="Automatically classify your income sources" />
          <Feature icon={Shield} title="Nigerian Tax Act 2026" desc="Fully compliant with latest tax regulations" />
          <Feature icon={FileCheck} title="One-Click Filing" desc="Generate your filing pack in seconds" />
        </div>
        <p className="text-primary-foreground/40 text-sm">© 2026 TaxWise Nigeria</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <h1 className="text-2xl font-bold text-primary">TaxWise</h1>
            <p className="text-muted-foreground">AI-Powered Tax Filing</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isSignUp ? 'Sign up to start managing your taxes' : 'Sign in to manage your Nigerian tax filings'}
            </p>
          </div>
          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <Input
                    placeholder="Adebayo Ogunlesi"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Your State
                  </label>
                  <Select value={selectedState} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your state" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {ALL_NIGERIAN_STATES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                          {(SUPPORTED_STATES as readonly string[]).includes(s) && (
                            <span className="ml-2 text-xs text-primary">✓ Supported</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showWaitlist && selectedState && (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <Clock className="h-4 w-4 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Coming soon to {selectedState}!</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          TaxWise currently supports Lagos, FCT Abuja, and Rivers. Join the waitlist and we'll notify you when we expand.
                        </p>
                      </div>
                    </div>
                    {!waitlistSubmitted ? (
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          value={waitlistEmail}
                          onChange={(e) => setWaitlistEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button type="button" size="sm" onClick={handleWaitlistSubmit}>
                          Join
                        </Button>
                      </div>
                    ) : (
                      <p className="text-sm text-primary font-medium">🎉 You're on the list!</p>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Sign Up' : 'Sign In'} <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 rounded-lg bg-primary-foreground/10">
        <Icon className="h-5 w-5 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-medium text-primary-foreground">{title}</h3>
        <p className="text-sm text-primary-foreground/60">{desc}</p>
      </div>
    </div>
  );
}
