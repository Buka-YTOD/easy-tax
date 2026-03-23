import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, Send, Loader2 } from 'lucide-react';

export default function FeatureSuggestions() {
  const { user } = useAppContext();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: suggestions = [], refetch } = useQuery({
    queryKey: ['feature-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('feature_suggestions').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
      });
      if (error) throw error;

      // Send email notification (fire-and-forget)
      supabase.functions.invoke('send-suggestion', {
        body: { title: title.trim(), description: description.trim(), userEmail: user.email },
      }).catch(console.error);

      toast({ title: 'Thanks! 🎉', description: 'Your suggestion has been submitted.' });
      setTitle('');
      setDescription('');
      refetch();
    } catch {
      toast({ title: 'Error', description: 'Could not submit suggestion. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Suggest a Feature</h1>
        <p className="text-muted-foreground">Have an idea to make Tax Ease better? We'd love to hear it!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> Share your idea
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="e.g. Add dark mode, Export to Excel..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                required
              />
            </div>
            <div>
              <Textarea
                placeholder="Tell us more about this feature (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Submit Suggestion</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {suggestions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Your Suggestions</h2>
          {suggestions.map((s: any) => (
            <Card key={s.id}>
              <CardContent className="p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{s.title}</p>
                  <Badge variant={s.status === 'pending' ? 'secondary' : 'default'} className="shrink-0 text-xs">
                    {s.status}
                  </Badge>
                </div>
                {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
                <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
