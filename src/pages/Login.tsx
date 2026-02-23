import { useNavigate, Navigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Shield, Brain, FileCheck } from 'lucide-react';

export default function Login() {
  const { login, isAuthenticated } = useAppContext();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const handleContinue = () => {
    login();
    navigate('/app/dashboard');
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
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden">
            <h1 className="text-2xl font-bold text-primary">TaxWise</h1>
            <p className="text-muted-foreground">AI-Powered Tax Filing</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">Sign in to manage your Nigerian tax filings</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input placeholder="adebayo@example.com" defaultValue="adebayo@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input type="password" placeholder="••••••••" defaultValue="password" />
            </div>
            <Button className="w-full" onClick={handleContinue}>
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">Demo mode — click Continue to access the app</p>
        </div>
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
