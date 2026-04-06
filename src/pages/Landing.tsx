import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  MapPin,
  ClipboardCheck,
  BookOpen,
  Receipt,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import logoSvg from '@/assets/logo.svg';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoSvg} alt="Tax Ease" className="h-7 w-7" />
            <span className="text-lg font-bold tracking-tight text-foreground">Tax Ease</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Log in
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 pt-24 pb-20 md:pt-36 md:pb-28">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-6">
            Currently available for Lagos State
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-extrabold tracking-tight leading-[1.1]">
            You earned it.<br />
            We help you file it<br />
            <span className="text-primary">correctly.</span>
          </h1>
          <p className="mt-8 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Most Nigerians know they should file taxes. The problem was never willingness.
            It was knowing <em>how</em>, which form to use, what reliefs apply, and where
            to submit. Tax Ease removes the guesswork.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Link to="/login">
              <Button size="lg" className="text-base h-12 px-8">
                File Your Return <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <a href="#what-you-get">
              <Button variant="outline" size="lg" className="text-base h-12 px-8 group">
                What you get <ChevronDown className="h-4 w-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ─── The Problem ─── */}
      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">The reality</p>
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug max-w-2xl">
            Tax compliance in Nigeria shouldn't require a consultant, a spreadsheet, and three visits to the tax office.
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-x-12 gap-y-8">
            <ProblemPoint
              icon={HelpCircle}
              text="You don't know if your employer deducted the right amount, and you can't verify it yourself."
            />
            <ProblemPoint
              icon={FileText}
              text="Form A, Form H, CRA, graduated tax rates. The terminology alone is designed to confuse."
            />
            <ProblemPoint
              icon={Receipt}
              text="You earned income from multiple sources last year. Where do you even begin?"
            />
            <ProblemPoint
              icon={MapPin}
              text="Every state has its own portal and process. What works in Lagos doesn't apply in Abuja."
            />
          </div>
        </div>
      </section>

      {/* ─── What You Get ─── */}
      <section id="what-you-get" className="py-20 md:py-28 bg-card border-t border-border/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">What you get</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              Not another calculator. A complete filing toolkit that knows Nigerian tax law.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <FeatureCard
              icon={ClipboardCheck}
              title="Guided Tax Computation"
              description="Answer plain-language questions about your income, deductions, and filing status. We handle CRA calculations, pension relief, graduated rates, and minimum tax rules automatically."
            />
            <FeatureCard
              icon={FileText}
              title="Filing-Ready Forms"
              description="Generate the exact Form A or Form H required by LIRS, pre-filled with your data. Download and submit directly to the Lagos Inland Revenue Service."
            />
            <FeatureCard
              icon={ShieldCheck}
              title="2026 Tax Act Compliant"
              description="Built on the current Nigerian Tax Act. When the law changes, we update. You don't have to re-learn anything."
            />
            <FeatureCard
              icon={BookOpen}
              title="Step-by-Step Filing Guides"
              description="Detailed walkthroughs for the LIRS payment portal and tax return submission process. Every screen, every button, every field explained."
            />
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-20 md:py-28 border-t border-border/40">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">How it works</p>
          <h2 className="text-2xl sm:text-3xl font-bold mb-14">
            Three steps. One afternoon. Done for the year.
          </h2>
          <div className="space-y-12">
            <Step
              number="01"
              title="Tell us about your year"
              description="Salary, freelance income, rental income, capital gains. We ask specific questions so nothing gets missed. If you don't understand a term, the built-in glossary explains it in plain language."
            />
            <Step
              number="02"
              title="Review your computation"
              description="See exactly how your taxable income and tax liability were calculated. Every relief, every deduction, broken down line by line. No black box."
            />
            <Step
              number="03"
              title="Download and file"
              description="Get your completed tax forms and follow our step-by-step guide to submit on your state's portal. We walk you through every click."
            />
          </div>
        </div>
      </section>

      {/* ─── Who This Is For ─── */}
      <section className="py-20 md:py-28 bg-card border-t border-border/40">
        <div className="mx-auto max-w-5xl px-6">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-medium text-primary tracking-wide uppercase mb-4">Built for you</p>
            <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
              If you earn income in Nigeria and want to file correctly, this is your tool.
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            <AudienceCard
              title="Salaried Employees"
              points={[
                'Verify your employer\'s PAYE deductions',
                'Claim reliefs you may be missing',
                'File your annual return confidently',
              ]}
            />
            <AudienceCard
              title="Freelancers & Contractors"
              points={[
                'Consolidate multiple income streams',
                'Identify deductible business expenses',
                'Generate the right form for your state',
              ]}
            />
            <AudienceCard
              title="Sole Proprietors"
              points={[
                'Separate business and personal income',
                'Apply capital allowances correctly',
                'Stay compliant without an accountant',
              ]}
            />
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-24 md:py-32 border-t border-border/40">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop putting it off.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            The filing deadline doesn't wait. Create your account, compute your tax,
            and file your return. It takes less time than you think.
          </p>
          <div className="mt-10">
            <Link to="/login">
              <Button size="lg" className="text-base h-13 px-10">
                Get Started <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            N5,000 per tax return workspace. Pay once, file with confidence.
          </p>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-5xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="Tax Ease" className="h-5 w-5" />
            <span className="text-sm font-semibold text-foreground">Tax Ease</span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Tax Ease Nigeria. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ─── Sub-components ─── */

function ProblemPoint({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="h-5 w-5 text-muted-foreground/60 mt-0.5 shrink-0" />
      <p className="text-muted-foreground leading-relaxed text-[15px]">{text}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-border/50 bg-background">
      <CardContent className="p-7">
        <div className="p-2.5 rounded-lg bg-primary/10 w-fit mb-4">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-base font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6">
      <span className="text-3xl font-black text-primary/20 leading-none pt-1 select-none">{number}</span>
      <div>
        <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
        <p className="text-muted-foreground text-[15px] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function AudienceCard({ title, points }: { title: string; points: string[] }) {
  return (
    <Card className="border-border/50 bg-background">
      <CardContent className="p-7">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        <ul className="space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
