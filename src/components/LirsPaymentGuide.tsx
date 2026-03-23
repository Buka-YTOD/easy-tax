import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import csvRaw from '@/assets/lirs-payment-guide.csv?raw';
import { GlossaryFloatingButton } from '@/components/GlossaryFloatingButton';

interface Step {
  id: string;
  step_order: number;
  title: string;
  description: string;
  image_url: string;
  image_alt: string;
}

function parseCSV(raw: string): Step[] {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) return [];

  const rows: Step[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    cols.push(current.trim());

    rows.push({
      id: cols[0] || '',
      step_order: parseInt(cols[1] || '0', 10),
      title: cols[2] || '',
      description: cols[3] || '',
      image_url: cols[4] || '',
      image_alt: cols[5] || '',
    });
  }

  return rows.sort((a, b) => a.step_order - b.step_order);
}

/** Convert Google Drive share links to direct image URLs */
function toDirectImageUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

/** Render description text, converting URLs into clickable links */
function RichDescription({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s,]+)/g;
  const parts = text.split(urlRegex);

  return (
    <span>
      {parts.map((part, i) => {
        if (urlRegex.test(part)) {
          urlRegex.lastIndex = 0;
          const isRelative = part.includes('easy-tax.lovable.app') || part.startsWith('/');
          const href = part.includes('easy-tax.lovable.app')
            ? new URL(part).pathname
            : part;
          return (
            <a
              key={i}
              href={href}
              target={isRelative ? '_self' : '_blank'}
              rel={isRelative ? undefined : 'noopener noreferrer'}
              className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-0.5"
            >
              {isRelative ? 'click here' : 'click here'}
              {!isRelative && <ExternalLink className="h-3 w-3 inline" />}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function LirsPaymentGuide() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const parsed = parseCSV(csvRaw);
    setSteps(parsed);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">How to Pay Tax on LIRS</h1>
        <p className="text-muted-foreground mt-1">
          Follow these steps to pay your Lagos State tax through the LIRS portal.
        </p>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const imgUrl = toDirectImageUrl(step.image_url);
          return (
            <Card key={step.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <Badge
                      variant="secondary"
                      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold bg-primary/10 text-primary border-0"
                    >
                      {step.step_order}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-3">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <RichDescription text={step.description} />
                    </p>
                    {imgUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-border">
                        <img
                          src={imgUrl}
                          alt={step.image_alt || step.title}
                          className="w-full max-h-[400px] object-contain bg-muted/30"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <GlossaryFloatingButton />
    </div>
  );
}
