import { useState, useEffect } from 'react';
import { db, Document } from '@/lib/db';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Star, Trash2, Share2, Lock } from 'lucide-react';
import { shareFile, vibrate } from '@/lib/capacitor-utils';
import { authenticateWithBiometrics } from '@/lib/biometric-utils';
import { useToast } from '@/hooks/use-toast';
import { ImpactStyle } from '@capacitor/haptics';

export const Documents = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    authenticateUser();
  }, []);

  const authenticateUser = async () => {
    setIsLoading(true);
    const result = await authenticateWithBiometrics('Authenticate to access your documents');
    setIsAuthenticated(result);
    if (result) {
      loadDocuments();
    }
    setIsLoading(false);
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const docs = await db.documents.orderBy('createdAt').reverse().toArray();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleShare = async (doc: Document) => {
    try {
      await vibrate(ImpactStyle.Light);
      await shareFile(doc.filePath, doc.name);
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Could not share document',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (doc: Document) => {
    try {
      await vibrate(ImpactStyle.Medium);
      await db.documents.delete(doc.id!);
      await loadDocuments();
      toast({
        title: 'Deleted',
        description: 'Document moved to trash'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive'
      });
    }
  };

  const toggleFavorite = async (doc: Document) => {
    try {
      await vibrate(ImpactStyle.Light);
      await db.documents.update(doc.id!, { favorite: !doc.favorite });
      await loadDocuments();
    } catch (error) {
      console.error('Favorite error:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <Lock className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            Please authenticate to access your documents
          </p>
          <Button onClick={authenticateUser} className="w-full">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-20">
      <div className="p-4 border-b border-border bg-card">
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-2">
            <FileText className="h-16 w-16 text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No documents found' : 'No documents yet'}
            </p>
            <p className="text-sm text-muted-foreground">
              {!searchQuery && 'Start by scanning your first document'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-lg mx-auto">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{doc.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {doc.pages} {doc.pages === 1 ? 'page' : 'pages'} • {formatFileSize(doc.size)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(doc.createdAt)}
                    </p>
                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-0.5 bg-muted rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleFavorite(doc)}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          doc.favorite ? 'fill-yellow-500 text-yellow-500' : ''
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleShare(doc)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
