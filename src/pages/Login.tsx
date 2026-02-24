import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Shield, Brain, FileCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const { isAuthenticated, isLoading: appLoading } = useAppContext();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
      } else {
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  placeholder="Adebayo Ogunlesi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
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
