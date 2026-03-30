import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, MessageSquare } from 'lucide-react';

export default function AdminSuggestions() {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['admin-feature-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_suggestions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" /> User Suggestions
        </h1>
        <p className="text-muted-foreground">Review feature suggestions from users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" /> All Suggestions
            {suggestions.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{suggestions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No suggestions yet</p>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s: any) => (
                <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                  <Lightbulb className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={s.status === 'pending' ? 'secondary' : 'default'} className="text-[10px]">
                        {s.status}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
