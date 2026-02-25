import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/contexts/AppContext';
import { useTaxReturn } from '@/hooks/useTaxReturn';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DocumentExtractor } from '@/components/DocumentExtractor';
import { Upload, FileText, Trash2, File, Search, Tag, Loader2, Sparkles } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = ['Income Proof', 'Deduction Receipt', 'Capital Gain', 'Tax Certificate', 'ID Document', 'Other'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVault() {
  const { user } = useAppContext();
  const { data: returnData } = useTaxReturn();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('Other');
  const [uploading, setUploading] = useState(false);
  const [extractDocId, setExtractDocId] = useState<string | null>(null);

  const returnId = returnData?.taxReturn?.id;

  // Fetch documents from DB
  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents', returnId],
    queryFn: async () => {
      if (!returnId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('return_id', returnId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!returnId,
  });

  // Upload file to storage + insert DB row
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || !returnId) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 10MB)`, variant: 'destructive' });
        continue;
      }

      const filePath = `${user.id}/${crypto.randomUUID()}_${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadErr) {
        toast({ title: `Failed to upload ${file.name}`, variant: 'destructive' });
        continue;
      }

      const { error: dbErr } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          return_id: returnId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type || null,
          status: 'uploaded',
          metadata_json: { category: selectedCategory, size: file.size },
        });

      if (dbErr) {
        toast({ title: `Failed to save ${file.name}`, variant: 'destructive' });
      } else {
        toast({ title: `${file.name} uploaded` });
      }
    }

    queryClient.invalidateQueries({ queryKey: ['documents', returnId] });
    setUploading(false);
    e.target.value = '';
  }, [user, returnId, selectedCategory, toast, queryClient]);

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const doc = docs.find(d => d.id === id);
      if (!doc) return;
      await supabase.storage.from('documents').remove([doc.file_path]);
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', returnId] });
      setDeleteId(null);
      toast({ title: 'Document removed' });
    },
  });

  const filtered = docs.filter(d => {
    const meta = d.metadata_json as any;
    const cat = meta?.category || 'Other';
    if (filterCategory !== 'all' && cat !== filterCategory) return false;
    if (search && !d.file_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Vault</h1>
        <p className="text-muted-foreground">Store receipts and documents securely in the cloud</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Documents</CardTitle>
          <CardDescription>Images, PDFs, and documents up to 10MB each.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-44">
                <Tag className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-sm text-muted-foreground">Click to upload files</span>
                <span className="text-xs text-muted-foreground/60">PDF, images, documents</span>
              </>
            )}
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </CardContent>
      </Card>

      {docs.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30" />
            <h3 className="font-semibold mt-4">{docs.length === 0 ? 'No documents yet' : 'No matches'}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {docs.length === 0 ? 'Upload receipts, certificates, and tax documents.' : 'Try a different search or filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(doc => {
            const meta = doc.metadata_json as any;
            return (
              <Card key={doc.id} className="group">
                <CardContent className="py-3 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <File className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{meta?.category || 'Other'}</Badge>
                      {doc.status === 'extracted' && (
                        <Badge variant="secondary" className="text-[10px] gap-0.5">
                          <Sparkles className="h-2.5 w-2.5" /> Scanned
                        </Badge>
                      )}
                      {meta?.size && <span className="text-[10px] text-muted-foreground">{formatFileSize(meta.size)}</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Scan with AI" onClick={() => setExtractDocId(doc.id)}>
                      <Sparkles className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {extractDocId && (() => {
        const doc = docs.find(d => d.id === extractDocId);
        if (!doc) return null;
        return (
          <DocumentExtractor
            documentId={doc.id}
            filePath={doc.file_path}
            fileName={doc.file_name}
            fileType={doc.file_type}
            onClose={() => {
              setExtractDocId(null);
              queryClient.invalidateQueries({ queryKey: ['documents', returnId] });
            }}
          />
        );
      })()}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Document"
        description="Remove this document? This cannot be undone."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
