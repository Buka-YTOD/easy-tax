import { useState } from 'react';
import { HelpCircle, Search, BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import glossaryRaw from '@/assets/tax-glossary.md?raw';
import { useMemo } from 'react';

interface GlossarySection {
  id: string;
  level: number;
  title: string;
  content: string;
  parentId?: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

function parseGlossary(raw: string): GlossarySection[] {
  const lines = raw.split('\n');
  const sections: GlossarySection[] = [];
  let current: GlossarySection | null = null;
  const parentStack: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^# (.+)/);
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h1Match && !h2Match && !h3Match) {
      if (current) sections.push(current);
      const title = h1Match[1].trim();
      const id = slugify(title);
      parentStack[0] = id;
      current = { id, level: 1, title, content: '' };
    } else if (h2Match && !h3Match) {
      if (current) sections.push(current);
      const title = h2Match[1].trim();
      const id = slugify(title);
      parentStack[1] = id;
      current = { id, level: 2, title, content: '', parentId: parentStack[0] };
    } else if (h3Match) {
      if (current) sections.push(current);
      const title = h3Match[1].trim();
      const id = slugify(title);
      current = { id, level: 3, title, content: '', parentId: parentStack[1] || parentStack[0] };
    } else if (current) {
      if (line.trim() === '---') continue;
      current.content += line + '\n';
    }
  }
  if (current) sections.push(current);
  return sections;
}

function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 bg-muted rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <li key={i} className="ml-4 text-sm text-muted-foreground list-disc">
          <InlineMarkdown text={text} />
        </li>
      );
      continue;
    }

    const numMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-muted-foreground list-decimal">
          <InlineMarkdown text={numMatch[2]} />
        </li>
      );
      continue;
    }

    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
        <InlineMarkdown text={line} />
      </p>
    );
  }

  return <div className="space-y-1">{elements}</div>;
}

const categoryColors: Record<string, string> = {
  'income-glossary': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'deductions': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'adjustments': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'personal-reliefs': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'tax-returns': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  'quick-reference': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

export function GlossaryFloatingButton() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const sections = useMemo(() => parseGlossary(glossaryRaw), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [sections, search]);

  const getCategoryColor = (section: GlossarySection) => {
    const parentId = section.level === 1 ? section.id : section.parentId;
    if (parentId && categoryColors[parentId]) return categoryColors[parentId];
    return 'bg-muted text-muted-foreground';
  };

  const getParentTitle = (section: GlossarySection) => {
    if (section.level === 1) return null;
    return sections.find(s => s.id === section.parentId && s.level === 1)?.title;
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 z-40 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open tax glossary"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Tax Glossary
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tax terms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="overflow-y-auto flex-1 space-y-3 pr-1">
            {filtered.map((section) => {
              const parentTitle = getParentTitle(section);
              return (
                <Card key={section.id} className="shadow-sm">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      {section.level === 1 ? (
                        <h2 className="text-base font-bold text-foreground">{section.title}</h2>
                      ) : section.level === 2 ? (
                        <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                      ) : (
                        <h4 className="text-sm font-medium text-foreground">{section.title}</h4>
                      )}
                      {parentTitle && (
                        <Badge variant="secondary" className={`text-[10px] shrink-0 ${getCategoryColor(section)}`}>
                          {parentTitle}
                        </Badge>
                      )}
                    </div>
                    {section.content.trim() && renderContent(section.content)}
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No terms found for "{search}"</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
