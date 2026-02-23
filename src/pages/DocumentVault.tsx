import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStoredList, setStoredList } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Upload, FileText, Trash2, Image, File, Search, Plus, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StoredDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  dataUrl: string;
  addedAt: string;
  notes: string;
}

const CATEGORIES = ['Income Proof', 'Deduction Receipt', 'Capital Gain', 'Tax Certificate', 'ID Document', 'Other'];

function useDocuments() {
  const key = 'document_vault';
  const [docs, setDocs] = useState<StoredDocument[]>(() => getStoredList<StoredDocument>(key));

  const addDoc = useCallback((doc: StoredDocument) => {
    setDocs(prev => {
      const updated = [...prev, doc];
      setStoredList(key, updated);
      return updated;
    });
  }, []);

  const removeDoc = useCallback((id: string) => {
    setDocs(prev => {
      const updated = prev.filter(d => d.id !== id);
      setStoredList(key, updated);
      return updated;
    });
  }, []);

  return { docs, addDoc, removeDoc };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVault() {
  const { docs, addDoc, removeDoc } = useDocuments();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('Other');

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} is too large (max 5MB)`, variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const doc: StoredDocument = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          type: file.type,
          category: selectedCategory,
          dataUrl: ev.target?.result as string,
          addedAt: new Date().toISOString(),
          notes: '',
        };
        addDoc(doc);
        toast({ title: `${file.name} uploaded` });
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  }, [addDoc, toast, selectedCategory]);

  const handleDelete = () => {
    if (deleteId) {
      removeDoc(deleteId);
      setDeleteId(null);
      toast({ title: 'Document removed' });
    }
  };

  const filtered = docs.filter(d => {
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Document Vault</h1>
        <p className="text-muted-foreground">Store receipts and documents for your tax records</p>
      </div>

      {/* Upload area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Documents</CardTitle>
          <CardDescription>Images, PDFs, and documents up to 5MB each. Stored locally on your device.</CardDescription>
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
            <Upload className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-sm text-muted-foreground">Click to upload files</span>
            <span className="text-xs text-muted-foreground/60">PDF, images, documents</span>
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={handleUpload} />
          </label>
        </CardContent>
      </Card>

      {/* Filter / search */}
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

      {/* Document list */}
      {filtered.length === 0 ? (
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
          {filtered.map(doc => (
            <Card key={doc.id} className="group">
              <CardContent className="py-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {isImage(doc.type) ? (
                    <img src={doc.dataUrl} alt={doc.name} className="h-full w-full object-cover rounded-lg" />
                  ) : (
                    <File className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">{doc.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatFileSize(doc.size)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(doc.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteId(doc.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Document"
        description="Remove this document from your vault? This cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
