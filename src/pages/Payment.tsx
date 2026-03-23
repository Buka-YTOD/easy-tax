import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, CheckCircle2, Loader2, ArrowRight, Sparkles, FileCheck, Brain } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

async function paystackFetch(action: string, method = 'GET', body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const res = await fetch(
    `https://${PROJECT_ID}.supabase.co/functions/v1/paystack?action=${action}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        apikey: ANON_KEY,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }
  );
  return res.json();
}

export default function Payment() {
  const { isAuthenticated, isLoading: appLoading } = useAppContext();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [subscriptionActive, setSubscriptionActive] = useState<boolean | null>(null);

  const paymentRef = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    if (!isAuthenticated) return;
    if (paymentRef) {
      verifyPayment(paymentRef);
    } else {
      checkSubscription();
    }
  }, [isAuthenticated, paymentRef]);

  const checkSubscription = async () => {
    try {
      const result = await paystackFetch('status');
      setSubscriptionActive(result.active);
    } catch {
      setSubscriptionActive(false);
    }
  };

  const verifyPayment = async (ref: string) => {
    setVerifying(true);
    try {
      const result = await paystackFetch('verify', 'POST', { reference: ref });
      if (result.success) {
        setSubscriptionActive(true);
        toast({ title: 'Payment successful! 🎉', description: 'Your account is now active.' });
      } else {
        toast({ title: 'Payment verification failed', description: result.error || 'Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Verification error', description: 'Please try again.', variant: 'destructive' });
    }
    setVerifying(false);
  };

  const handlePayment = async () => {
    setLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/payment`;
      const result = await paystackFetch('initialize', 'POST', { callback_url: callbackUrl });
      if (result.authorization_url) {
        window.location.href = result.authorization_url;
      } else {
        toast({ title: 'Error', description: 'Could not initialize payment. Please try again.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }
    setLoading(false);
  };

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Verifying your payment…</p>
        </div>
      </div>
    );
  }

  if (subscriptionActive === true) return <Navigate to="/app/home" replace />;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Activate Tax Ease</h1>
          <p className="text-muted-foreground">Get full access to AI-powered tax filing for Nigeria</p>
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Monthly Plan</CardTitle>
            <CardDescription>Everything you need to file with confidence</CardDescription>
            <div className="pt-2">
              <span className="text-4xl font-bold text-foreground">₦5,000</span>
              <span className="text-muted-foreground">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3">
              {[
                { icon: Brain, text: 'AI-powered income classification' },
                { icon: FileCheck, text: 'Auto-generated filing packs' },
                { icon: Shield, text: 'Nigerian Tax Act 2026 compliant' },
                { icon: CheckCircle2, text: 'Unlimited tax computations' },
                { icon: CheckCircle2, text: 'Document vault & storage' },
                { icon: CheckCircle2, text: 'Year-over-year comparison' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{text}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full h-12 text-base"
              onClick={handlePayment}
              disabled={loading || subscriptionActive === null}
            >
              {loading || subscriptionActive === null ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Pay ₦5,000 & Get Started <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secured by Paystack • Cancel anytime</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
