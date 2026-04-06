import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Calculator,
  Shield,
  Brain,
  FileCheck,
  Landmark,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  ChevronRight,
  Briefcase,
  Laptop,
  Store,
} from 'lucide-react';
import logoSvg from '@/assets/logo.svg';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Tax Calculation',
    description:
      'Answer simple questions in a guided conversation. Our AI classifies your income and computes your tax. No spreadsheets needed.',
  },
  {
    icon: Shield,
    title: 'Nigerian Tax Act 2026 Compliant',
    description:
      'Built on the latest tax legislation. We handle CRA, graduated rates, pension relief, and more so you don\'t have to.',
  },
  {
    icon: FileCheck,
    title: 'Filing-Ready Documents',
    description:
      'Generate Form A (individuals) and Form H (businesses) that are ready to submit to LIRS, FCT-IRS, or Rivers IRS.',
  },
  {
    icon: Landmark,
    title: 'Step-by-Step LIRS Guides',
    description:
      'Follow our detailed guides to pay your tax and file returns on the LIRS platform. No confusion, no mistakes.',
  },
];

const benefits = [
  { icon: Clock, text: 'File in under 15 minutes' },
  { icon: Zap, text: 'Instant tax computation' },
  { icon: Users, text: 'Built for employees & freelancers' },
  { icon: CheckCircle2, text: 'Lagos, Abuja & Rivers supported' },
];

const steps = [
  {
    number: '01',
    title: 'Answer a few questions',
    description: 'Tell us about your income, deductions, and filing status through a simple guided flow.',
  },
  {
    number: '02',
    title: 'We compute your tax',
    description: 'Our engine applies CRA, pension relief, graduated rates, and all applicable rules automatically.',
  },
  {
    number: '03',
    title: 'Download & file',
    description: 'Get your filing-ready tax forms and follow our step-by-step guide to submit to your state IRS.',
  },
];

const audiences = [
  {
    title: 'Salaried Employees',
    desc: 'Ensure your employer deducted the right amount and claim all reliefs you\'re entitled to.',
    icon: Briefcase,
  },
  {
    title: 'Freelancers',
    desc: 'Track multiple income streams, claim deductible expenses, and file on time.',
    icon: Laptop,
  },
  {
    title: 'Sole Proprietors',
    desc: 'Separate business and personal income, compute your tax, and stay compliant.',
    icon: Store,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src={logoSvg} alt="Tax Ease logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-foreground">Tax Ease</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 md:py-32 text-center">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            <Landmark className="h-3.5 w-3.5 mr-1.5 inline" /> Built for Nigerian taxpayers
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl mx-auto">
            File your taxes
            <br />
            <span className="text-primary">with confidence</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Tax Ease is the AI-powered platform that helps employees, freelancers, and sole proprietors in Nigeria
            prepare and file compliant tax returns in minutes, not hours.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="text-base px-8 h-12">
                Start Filing for Free <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="text-base px-8 h-12">
                See How It Works
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {benefits.map((b) => (
              <div key={b.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <b.icon className="h-4 w-4 text-primary" />
                <span>{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to file</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              From income classification to form generation, Tax Ease handles the complexity so you can focus on what
              matters.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50 bg-background hover:border-primary/30 transition-colors">
                <CardContent className="p-8">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-5">
                    <f.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How it works</h2>
            <p className="mt-4 text-muted-foreground text-lg">Three simple steps to a compliant tax return.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={s.number} className="relative">
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden md:block absolute -right-5 top-8 h-6 w-6 text-border" />
                )}
                <div className="text-5xl font-black text-primary/15 mb-3">{s.number}</div>
                <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-20 md:py-28 bg-card/50">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Who is Tax Ease for?</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              Whether you earn a salary, run a side hustle, or freelance full-time, we've got you covered.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {audiences.map((p) => (
              <Card key={p.title} className="text-center border-border/50 bg-background">
                <CardContent className="p-8">
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-4">
                    <p.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="p-3 rounded-xl bg-primary/10 w-fit mx-auto mb-6">
            <Calculator className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Ready to file your taxes?</h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
            Join thousands of Nigerians who file their tax returns the easy way. Create your account and start filing in
            minutes.
          </p>
          <Link to="/login" className="mt-8 inline-block">
            <Button size="lg" className="text-base px-10 h-12">
              Get Started for Free <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logoSvg} alt="Tax Ease" className="h-6 w-6" />
            <span className="font-semibold text-foreground">Tax Ease</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Tax Ease Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
