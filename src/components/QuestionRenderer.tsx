import { useState } from 'react';
import type { AIQuestion } from '@/types/guided';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send } from 'lucide-react';

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
];

function isStateQuestion(q: AIQuestion): boolean {
  const l = (q.label + ' ' + q.id).toLowerCase();
  return l.includes('state') && (l.includes('residen') || l.includes('operation') || l.includes('nigeria'));
}

function normalizeQuestion(q: AIQuestion): AIQuestion {
  if (q.type === 'select' && q.options && q.options.length > 0) return q;
  if (isStateQuestion(q)) {
    return { ...q, type: 'select', options: NIGERIAN_STATES };
  }
  return q;
}

interface QuestionRendererProps {
  questions: AIQuestion[];
  onSubmit: (answers: Record<string, string>) => void;
  disabled?: boolean;
}

export function QuestionRenderer({ questions, onSubmit, disabled }: QuestionRendererProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const normalized = questions.map(normalizeQuestion);

  const handleSubmit = () => {
    if (normalized.length === 0) return;
    const allAnswered = normalized.every((q) => answers[q.id]?.trim());
    if (!allAnswered) return;
    onSubmit(answers);
    setAnswers({});
  };

  if (normalized.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {normalized.map((q) => (
        <div key={q.id} className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">{q.label}</label>
          {q.type === 'select' && q.options ? (
            <Select
              value={answers[q.id] || ''}
              onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
            >
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent className="z-50 bg-popover">
                {q.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : q.type === 'yesno' ? (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={answers[q.id] === 'Yes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: 'Yes' }))}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={answers[q.id] === 'No' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: 'No' }))}
              >
                No
              </Button>
            </div>
          ) : (
            <Input
              type={q.type === 'number' || q.type === 'currency' ? 'number' : q.type === 'date' ? 'date' : 'text'}
              placeholder={q.type === 'currency' ? '₦ Amount' : 'Your answer...'}
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          )}
        </div>
      ))}
      <Button onClick={handleSubmit} disabled={disabled} size="sm" className="mt-2">
        <Send className="h-3.5 w-3.5 mr-2" /> Send
      </Button>
    </div>
  );
}
