import { useState } from 'react';
import { useClassifyIncome, useAIChat } from '@/hooks/useAI';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, Send, Sparkles, Loader2 } from 'lucide-react';
import { formatNaira } from '@/lib/format';
import type { ChatMessage } from '@/types/tax';

export default function AIAssistant() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">Get AI help with income classification and tax questions</p>
      </div>
      <Tabs defaultValue="classify" className="space-y-4">
        <TabsList>
          <TabsTrigger value="classify">Classify Income</TabsTrigger>
          <TabsTrigger value="chat">Tax Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="classify"><ClassifyTab /></TabsContent>
        <TabsContent value="chat"><ChatTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function ClassifyTab() {
  const [text, setText] = useState('');
  const classify = useClassifyIncome();
  const result = classify.data;

  const handleClassify = () => {
    if (!text.trim()) return;
    classify.mutate(text);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Income Classifier
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste a description of your income... e.g. 'I received ₦500,000 monthly salary from ABC Corp as a software engineer'"
            rows={4}
          />
          <Button onClick={handleClassify} disabled={classify.isPending || !text.trim()}>
            {classify.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Classify
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Classification Result</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Suggested Type</p>
                <Badge className="mt-1">{result.suggestedType}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold">{(result.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
            {result.extractedFields.amount && (
              <div>
                <p className="text-sm text-muted-foreground">Extracted Amount</p>
                <p className="font-medium">{formatNaira(result.extractedFields.amount)}</p>
              </div>
            )}
            {result.followUpQuestions.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Follow-up Questions</p>
                <ul className="space-y-1">
                  {result.followUpQuestions.map((q, i) => (
                    <li key={i} className="text-sm bg-muted p-2 rounded">{q}</li>
                  ))}
                </ul>
              </div>
            )}
            <Button variant="outline">Create Income Record from Suggestion</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const chat = useAIChat();

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    chat.mutate(
      { message: input, conversationId: 'conv_1' },
      {
        onSuccess: (response) => {
          setMessages((prev) => [...prev, response]);
        },
      }
    );
  };

  return (
    <Card className="flex flex-col" style={{ height: '600px' }}>
      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">Ask me anything about Nigerian tax law</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <p className="text-xs opacity-70">Sources:</p>
                  {msg.citations.map((c, i) => (
                    <p key={i} className="text-xs opacity-60">{c}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {chat.isPending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </CardContent>
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a tax question..."
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          />
          <Button onClick={handleSend} disabled={chat.isPending || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ⚠️ This is not legal advice. Consult a qualified tax professional.
        </p>
      </div>
    </Card>
  );
}
