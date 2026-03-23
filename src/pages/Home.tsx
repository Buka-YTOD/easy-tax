import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Landmark, FileCheck, BookOpen, ArrowRight } from 'lucide-react';

const tools = [
  {
    title: 'Tax Calculator',
    description: 'Calculate your tax step-by-step with a simple guided conversation.',
    icon: Calculator,
    path: '/app/tax-calculator',
    color: 'bg-primary/10 group-hover:bg-primary/20',
    iconColor: 'text-primary',
  },
  {
    title: 'LIRS Payment Guide',
    description: 'Step-by-step guide on how to pay your tax on LIRS.',
    icon: Landmark,
    path: '/app/lirs-guide',
    color: 'bg-accent group-hover:bg-accent/80',
    iconColor: 'text-accent-foreground',
  },
  {
    title: 'LIRS Tax Return Guide',
    description: 'Learn how to file your tax return on the LIRS platform.',
    icon: FileCheck,
    path: '/app/lirs-tax-return',
    color: 'bg-muted group-hover:bg-muted/80',
    iconColor: 'text-muted-foreground',
  },
  {
    title: 'Tax Glossary',
    description: 'Look up tax terms and definitions in plain language.',
    icon: BookOpen,
    path: '/app/glossary',
    color: 'bg-secondary group-hover:bg-secondary/80',
    iconColor: 'text-secondary-foreground',
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Welcome to Tax Ease 🇳🇬</h1>
        <p className="text-muted-foreground text-lg">Your simple toolkit for Nigerian taxes.</p>
      </div>

      <div className="grid gap-4">
        {tools.map((tool) => (
          <Link key={tool.path} to={tool.path}>
            <Card className="group hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-6 flex items-start gap-4">
                <div className={`p-3 rounded-xl transition-colors ${tool.color}`}>
                  <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">{tool.title}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
