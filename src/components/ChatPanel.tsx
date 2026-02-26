import { useRef, useEffect, useState } from 'react';
import type { GuidedMessage } from '@/types/guided';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import { ProposedActionsList, actionKey } from '@/components/ProposedActionsList';
import type { SuggestedAction } from '@/types/guided';
import { Send, Bot, User, HelpCircle, Loader2 } from 'lucide-react';

interface ChatPanelProps {
  messages: GuidedMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onConfirmAction: (action: SuggestedAction) => void;
  confirmedActionIds: Set<string>;
  isConfirming?: boolean;
}

export function ChatPanel({ messages, isLoading, onSend, onConfirmAction, confirmedActionIds, isConfirming }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleQuestionAnswer = (answers: Record<string, string>) => {
    const text = Object.values(answers).join(', ');
    onSend(text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-4 text-primary/30" />
            <p className="text-lg font-medium text-foreground">Let's do this together.</p>
            <p className="text-sm mt-1">I'll guide you through your tax filing step by step.</p>
          </div>
        )}

        {messages.map((msg, msgIndex) => {
          // Questions are only interactive on the latest assistant message
          const isLatestAssistant = msg.role === 'assistant' &&
            msgIndex === messages.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop();

          return (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-card border rounded-bl-md'
              )}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.role === 'assistant' && isLatestAssistant && !isLoading &&
                (!msg.questions || msg.questions.length === 0) &&
                /\b(no|done|next|yes)\b/i.test(msg.content) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {/\byes\b/i.test(msg.content) && (
                    <Button size="sm" variant="outline" onClick={() => onSend('Yes')}>Yes</Button>
                  )}
                  {/\bno\b/i.test(msg.content) && (
                    <Button size="sm" variant="outline" onClick={() => onSend('No')}>No</Button>
                  )}
                  {/\bdone\b/i.test(msg.content) && (
                    <Button size="sm" variant="outline" onClick={() => onSend('Done')}>Done</Button>
                  )}
                  {/\bnext\b/i.test(msg.content) && (
                    <Button size="sm" variant="outline" onClick={() => onSend('Next')}>Next</Button>
                  )}
                </div>
              )}

              {msg.role === 'assistant' && msg.questions && msg.questions.length > 0 && isLatestAssistant && (
                <QuestionRenderer
                  questions={msg.questions}
                  onSubmit={handleQuestionAnswer}
                  disabled={isLoading}
                />
              )}

              {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.filter(a => a.type !== 'update_profile').length > 0 && (
                <ProposedActionsList
                  actions={msg.suggestedActions.filter(a => a.type !== 'update_profile')}
                  onConfirm={onConfirmAction}
                  confirmedIds={confirmedActionIds}
                  isConfirming={isConfirming}
                />
              )}
            </div>
            {msg.role === 'user' && (
              <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3">
            <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-card border rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-card p-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => onSend("I don't know")}
            disabled={isLoading}
            title="I don't know"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">
          ⚠ This is not legal advice. Consult a tax professional for official guidance.
        </p>
      </div>
    </div>
  );
}
