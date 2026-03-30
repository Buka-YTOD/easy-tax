import { useAdminUsers, useAdminFlags } from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatNaira } from '@/lib/format';
import { Users, AlertTriangle, FileText, ShieldCheck, Lightbulb } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const { data: users = [], isLoading: usersLoading } = useAdminUsers();
  const { data: flags = [], isLoading: flagsLoading } = useAdminFlags();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery({
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

  const unresolvedFlags = flags.filter(f => !f.resolved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-primary" /> Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Manage users, review returns, and resolve flags</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{users.length}</p>
              <p className="text-sm text-muted-foreground">Tax Returns</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{unresolvedFlags.length}</p>
              <p className="text-sm text-muted-foreground">Unresolved Flags</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{users.filter(u => u.status === 'filed').length}</p>
              <p className="text-sm text-muted-foreground">Filed Returns</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Tax Returns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {usersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No returns yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tax Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Income</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{u.fullName}</TableCell>
                    <TableCell>TY {u.taxYear}</TableCell>
                    <TableCell>
                      <Badge variant={u.status === 'filed' ? 'default' : 'secondary'}>{u.status}</Badge>
                    </TableCell>
                    <TableCell>{formatNaira(u.totalIncome)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* System Flags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">System Flags</CardTitle>
        </CardHeader>
        <CardContent>
          {flagsLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : flags.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No flags to review</p>
          ) : (
            <div className="space-y-3">
              {flags.slice(0, 20).map(flag => (
                <div key={flag.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${flag.resolved ? 'text-muted-foreground' : flag.severity === 'error' ? 'text-destructive' : 'text-yellow-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{flag.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{flag.flag_type}</Badge>
                      <Badge variant={flag.resolved ? 'secondary' : 'destructive'} className="text-[10px]">
                        {flag.resolved ? 'Resolved' : 'Open'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(flag.created_at).toLocaleDateString()}
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
