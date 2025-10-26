import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RotateCw, Image as ImageIcon, Type } from 'lucide-react';
import { applyFilter, Point, applyPerspectiveTransform } from '@/lib/opencv-utils';
import { createPDF, compressImage } from '@/lib/pdf-utils';
import { performOCR, initOCR } from '@/lib/ocr-utils';
import { db } from '@/lib/db';
import { saveFile, vibrate } from '@/lib/capacitor-utils';
import { Directory } from '@capacitor/filesystem';
import { ImpactStyle } from '@capacitor/haptics';
import { useToast } from '@/hooks/use-toast';

interface ReviewProps {
  imageDataUrl: string;
  corners: Point[];
  onComplete: () => void;
  onCancel: () => void;
}

export const Review = ({ imageDataUrl, corners, onComplete, onCancel }: ReviewProps) => {
  const [processedImage, setProcessedImage] = useState<string>('');
  const [filter, setFilter] = useState<'color' | 'grayscale' | 'bw'>('color');
  const [documentName, setDocumentName] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOCRing, setIsOCRing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    processImage();
    generateDefaultName();
    initOCR().catch(console.error);
  }, []);

  const generateDefaultName = () => {
    const now = new Date();
    const name = `Scan_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    setDocumentName(name);
  };

  const processImage = async () => {
    setIsProcessing(true);
    try {
      const img = new Image();
      img.onload = async () => {
        // Apply perspective transform if corners detected
        let transformed = imageDataUrl;
        if (corners.length === 4) {
          transformed = applyPerspectiveTransform(img, corners, 2000, 2800);
        }

        // Apply filter
        const filtered = await applyFilter(transformed, filter);
        setProcessedImage(filtered);
      };
      img.src = imageDataUrl;
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Error',
        description: 'Failed to process image',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (processedImage) {
      processImage();
    }
  }, [filter]);

  const handleOCR = async () => {
    if (!processedImage) return;

    setIsOCRing(true);
    try {
      await vibrate(ImpactStyle.Medium);
      const text = await performOCR(processedImage);
      setOcrText(text);
      toast({
        title: 'OCR Complete',
        description: 'Text extracted successfully'
      });
    } catch (error) {
      console.error('OCR error:', error);
      toast({
        title: 'OCR Failed',
        description: 'Could not extract text',
        variant: 'destructive'
      });
    } finally {
      setIsOCRing(false);
    }
  };

  const handleSave = async () => {
    if (!processedImage || !documentName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a document name',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    try {
      await vibrate(ImpactStyle.Heavy);

      // Compress image
      const compressed = await compressImage(processedImage, 0.85, 2000, 2800);

      // Create PDF
      const pdfBytes = await createPDF([
        {
          imageDataUrl: compressed,
          width: 595,
          height: 842
        }
      ], {
        title: documentName,
        author: 'Pro PDF Scanner'
      });

      // Save to filesystem
      const fileName = `${documentName}.pdf`;
      const base64 = btoa(String.fromCharCode(...pdfBytes));
      const filePath = await saveFile(base64, fileName, Directory.Documents);

      // Save to database
      await db.documents.add({
        name: documentName,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: 1,
        size: pdfBytes.length,
        tags: [],
        favorite: false,
        ocrText: ocrText || undefined,
        filePath: filePath
      });

      toast({
        title: 'Saved',
        description: 'Document saved successfully'
      });

      onComplete();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save document',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-2xl mx-auto space-y-4">
          <div>
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="Enter document name"
              className="mt-1"
            />
          </div>

          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <ImageIcon className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="ocr">
                <Type className="h-4 w-4 mr-2" />
                OCR
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <Card className="p-4">
                <Label className="mb-2 block">Filter</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={filter === 'color' ? 'default' : 'outline'}
                    onClick={() => setFilter('color')}
                    className="w-full"
                  >
                    Color
                  </Button>
                  <Button
                    variant={filter === 'grayscale' ? 'default' : 'outline'}
                    onClick={() => setFilter('grayscale')}
                    className="w-full"
                  >
                    Grayscale
                  </Button>
                  <Button
                    variant={filter === 'bw' ? 'default' : 'outline'}
                    onClick={() => setFilter('bw')}
                    className="w-full"
                  >
                    B&W
                  </Button>
                </div>
              </Card>

              {processedImage ? (
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={processedImage}
                    alt="Processed"
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-muted rounded-lg">
                  <RotateCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
            </TabsContent>

            <TabsContent value="ocr" className="space-y-4">
              {!ocrText ? (
                <Card className="p-8 text-center">
                  <Type className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Extract text from this document
                  </p>
                  <Button
                    onClick={handleOCR}
                    disabled={isOCRing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isOCRing ? 'Processing...' : 'Start OCR'}
                  </Button>
                </Card>
              ) : (
                <Card className="p-4">
                  <Label className="mb-2 block">Extracted Text</Label>
                  <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{ocrText}</pre>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border">
        <div className="flex gap-2 max-w-2xl mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleSave}
            disabled={isProcessing || !documentName.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {isProcessing ? 'Saving...' : 'Save PDF'}
          </Button>
        </div>
      </div>
    </div>
  );
};
