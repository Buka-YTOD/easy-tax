import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen } from 'lucide-react';
import glossaryRaw from '@/assets/tax-glossary.md?raw';

interface GlossarySection {
  id: string;
  level: number;
  title: string;
  content: string;
  parentId?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
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

function renderContent(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const header = tableRows[0];
      const body = tableRows.slice(1);
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {header.map((cell, i) => (
                  <th key={i} className="text-left p-2 border-b border-border font-semibold text-foreground bg-muted/50">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="p-2 border-b border-border text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
    }
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Table detection
    if (line.includes('|') && line.trim().startsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      // Skip separator rows
      if (cells.every(c => /^[-:]+$/.test(c))) {
        inTable = true;
        continue;
      }
      if (!inTable && i + 1 < lines.length && lines[i + 1].includes('---')) {
        inTable = true;
      }
      tableRows.push(cells);
      continue;
    }

    if (inTable) flushTable();

    if (!line.trim()) {
      elements.push(<div key={`br-${i}`} className="h-2" />);
      continue;
    }

    // List items
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const text = line.trim().replace(/^[-*]\s+/, '');
      elements.push(
        <li key={i} className="ml-4 text-sm text-muted-foreground list-disc">
          <InlineMarkdown text={text} />
        </li>
      );
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      elements.push(
        <li key={i} className="ml-4 text-sm text-muted-foreground list-decimal">
          <InlineMarkdown text={numMatch[2]} />
        </li>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm text-muted-foreground leading-relaxed">
        <InlineMarkdown text={line} />
      </p>
    );
  }

  if (inTable) flushTable();

  return <div className="space-y-1">{elements}</div>;
}

function InlineMarkdown({ text }: { text: string }) {
  // Handle bold, emoji, and inline code
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

const categoryColors: Record<string, string> = {
  'income-glossary': 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  'deductions': 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  'adjustments': 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  'personal-reliefs': 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  'withholding-tax-wht': 'bg-red-500/10 text-red-700 dark:text-red-400',
  'tax-returns': 'bg-teal-500/10 text-teal-700 dark:text-teal-400',
  'mandatory-disclosure-of-accommodation': 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  'additional-disclosures': 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
  'quick-reference': 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

export default function TaxGlossary() {
  const [search, setSearch] = useState('');
  const sections = useMemo(() => parseGlossary(glossaryRaw), []);

  const topLevelSections = useMemo(() => sections.filter(s => s.level === 1), [sections]);

  const filtered = useMemo(() => {
    if (!search.trim()) return sections;
    const q = search.toLowerCase();
    return sections.filter(
      s => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)
    );
  }, [sections, search]);

  const getParentTitle = (section: GlossarySection) => {
    if (section.level === 1) return null;
    const parent = sections.find(s => s.id === section.parentId && s.level === 1);
    return parent?.title;
  };

  const getCategoryColor = (section: GlossarySection) => {
    const parentId = section.level === 1 ? section.id : section.parentId;
    // Find the h1 ancestor
    if (parentId && categoryColors[parentId]) return categoryColors[parentId];
    const parent = sections.find(s => s.id === parentId);
    if (parent?.parentId && categoryColors[parent.parentId]) return categoryColors[parent.parentId];
    return 'bg-muted text-muted-foreground';
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setSearch('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Tax Glossary
        </h1>
        <p className="text-muted-foreground mt-1">
          Simple explanations of Nigerian tax terms with real-life examples.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a tax term... e.g. pension, dividend, CRA"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Quick nav - only shown when not searching */}
      {!search.trim() && (
        <div className="flex flex-wrap gap-2">
          {topLevelSections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollToSection(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:opacity-80 ${getCategoryColor(s)}`}
            >
              {s.title}
            </button>
          ))}
        </div>
      )}

      {/* Results count when searching */}
      {search.trim() && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {filtered.map((section) => {
          const parentTitle = getParentTitle(section);
          return (
            <Card key={section.id} id={section.id} className="scroll-mt-4">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 flex-wrap">
                    {section.level === 1 ? (
                      <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
                    ) : section.level === 2 ? (
                      <h3 className="text-base font-semibold text-foreground">{section.title}</h3>
                    ) : (
                      <h4 className="text-sm font-semibold text-foreground">{section.title}</h4>
                    )}
                    {parentTitle && (
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${getCategoryColor(section)}`}>
                        {parentTitle}
                      </Badge>
                    )}
                  </div>
                  {section.content.trim() && renderContent(section.content)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No terms found for "{search}"</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Try a different keyword</p>
        </div>
      )}
    </div>
  );
}
