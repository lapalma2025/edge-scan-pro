import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RotateCw, Image as ImageIcon, Type, FileSignature, RotateCcw, RotateCw as Rotate90, Sun, Contrast, X, Download } from 'lucide-react';
import { SignaturePad } from '@/components/SignaturePad';
import { applyFilter, Point, applyPerspectiveTransform, loadOpenCV } from '@/lib/opencv-utils';
import { createPDF, createPDFBase64, compressImage } from '@/lib/pdf-utils';
import { performOCR, initOCR } from '@/lib/ocr-utils';
import { db } from '@/lib/db';
import { saveFile, vibrate, shareFile } from '@/lib/capacitor-utils';
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
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signaturePosition, setSignaturePosition] = useState({ x: 50, y: 80 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      // Ensure OpenCV is ready for transforms/filters
      try { await loadOpenCV(); } catch (e) { console.warn('OpenCV not available, using canvas fallbacks'); }

      const img = new Image();
      img.onload = async () => {
        // Apply perspective transform if corners detected
        let transformed = imageDataUrl;
        if (corners.length === 4) {
          const t = applyPerspectiveTransform(img, corners, 2000, 2800);
          transformed = t && t.length > 0 ? t : imageDataUrl;
        }

        // Apply filter
        let filtered = await applyFilter(transformed, filter);

        // Apply rotation, brightness, contrast
        if (rotation !== 0 || brightness !== 0 || contrast !== 0) {
          filtered = await applyAdjustments(filtered, rotation, brightness, contrast);
        }

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

  const applyAdjustments = async (
    dataUrl: string,
    rot: number,
    bright: number,
    contr: number
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        // Handle rotation
        if (rot === 90 || rot === 270) {
          canvas.width = img.height;
          canvas.height = img.width;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rot * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Apply brightness and contrast
        if (bright !== 0 || contr !== 0) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const factor = (259 * (contr + 255)) / (255 * (259 - contr));

          for (let i = 0; i < data.length; i += 4) {
            // Brightness
            data[i] += bright;
            data[i + 1] += bright;
            data[i + 2] += bright;

            // Contrast
            data[i] = factor * (data[i] - 128) + 128;
            data[i + 1] = factor * (data[i + 1] - 128) + 128;
            data[i + 2] = factor * (data[i + 2] - 128) + 128;
          }

          ctx.putImageData(imageData, 0, 0);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.src = dataUrl;
    });
  };

  useEffect(() => {
    if (processedImage) {
      processImage();
    }
  }, [filter, rotation, brightness, contrast]);

  useEffect(() => {
    if (processedImage && canvasRef.current) {
      renderImageWithSignature();
    }
  }, [processedImage, signatureDataUrl, signaturePosition]);

  const renderImageWithSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !processedImage) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      if (signatureDataUrl) {
        const sigImg = new Image();
        sigImg.onload = () => {
          const sigWidth = img.width * 0.3;
          const sigHeight = (sigImg.height / sigImg.width) * sigWidth;
          const x = (signaturePosition.x / 100) * img.width - sigWidth / 2;
          const y = (signaturePosition.y / 100) * img.height - sigHeight / 2;
          ctx.drawImage(sigImg, x, y, sigWidth, sigHeight);
        };
        sigImg.src = signatureDataUrl;
      }
    };
    img.src = processedImage;
  };

  const handleSignatureConfirm = (sigDataUrl: string) => {
    setSignatureDataUrl(sigDataUrl);
    setShowSignaturePad(false);
    toast({
      title: 'Signature Added',
      description: 'You can adjust the position using the sliders'
    });
  };

  const getFinalImage = (): Promise<string> => {
    return new Promise((resolve) => {
      if (!signatureDataUrl) {
        resolve(processedImage);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(processedImage);
        return;
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    });
  };

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

  const handleSaveJPG = async () => {
    if (!processedImage) return;

    try {
      setIsProcessing(true);
      await vibrate(ImpactStyle.Medium);

      // Get final image with signature
      const finalImage = await getFinalImage();

      // Compress for JPG
      const compressed = await compressImage(finalImage, 0.9, 2000, 2800);

      // Convert to base64 without data URL prefix
      const base64 = compressed.split(',')[1];

      // Save to filesystem
      const fileName = `${documentName || 'scan'}_${Date.now()}.jpg`;
      const filePath = await saveFile(base64, fileName, Directory.Documents);

      toast({
        title: 'Saved',
        description: 'Image saved as JPG'
      });

      await shareFile(filePath, documentName || 'Scan');
    } catch (error) {
      console.error('Save JPG error:', error);
      toast({
        title: 'Export Failed',
        description: 'Could not save JPG',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
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

      // Get final image with signature
      const finalImage = await getFinalImage();

      // Compress image
      const compressed = await compressImage(finalImage, 0.85, 2000, 2800);

      // Create PDF (base64 to avoid large array conversions)
      const pdfBase64 = await createPDFBase64([
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
      const filePath = await saveFile(pdfBase64, fileName, Directory.Documents);

      // Save to database
      await db.documents.add({
        name: documentName,
        createdAt: new Date(),
        updatedAt: new Date(),
        pages: 1,
        size: Math.ceil((pdfBase64.length * 3) / 4),
        tags: [],
        favorite: false,
        ocrText: ocrText || undefined,
        filePath: filePath
      });

      toast({
        title: 'PDF Saved',
        description: `${documentName}.pdf saved successfully`
      });

      // Share the PDF
      await shareFile(filePath, documentName);

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
    <>
      {showSignaturePad && (
        <SignaturePad
          onConfirm={handleSignatureConfirm}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}

      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <div className="glass border-b border-border/50 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <h2 className="text-lg font-semibold">Review & Edit</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
              <Card className="card-modern p-4 space-y-4 border-0">
                <div>
                  <Label className="mb-3 block font-semibold flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    Color Mode
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={filter === 'color' ? 'default' : 'outline'}
                      onClick={() => setFilter('color')}
                      className={`w-full ${filter === 'color' ? 'bg-gradient-to-r from-primary to-primary/90 shadow-md' : ''}`}
                    >
                      Color
                    </Button>
                    <Button
                      variant={filter === 'grayscale' ? 'default' : 'outline'}
                      onClick={() => setFilter('grayscale')}
                      className={`w-full ${filter === 'grayscale' ? 'bg-gradient-to-r from-primary to-primary/90 shadow-md' : ''}`}
                    >
                      Gray
                    </Button>
                    <Button
                      variant={filter === 'bw' ? 'default' : 'outline'}
                      onClick={() => setFilter('bw')}
                      className={`w-full ${filter === 'bw' ? 'bg-gradient-to-r from-primary to-primary/90 shadow-md' : ''}`}
                    >
                      B&W
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block font-semibold">Rotation</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setRotation((rotation - 90 + 360) % 360)}
                      className="w-full hover:bg-secondary/80 hover:border-primary/50"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Left
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setRotation((rotation + 90) % 360)}
                      className="w-full hover:bg-secondary/80 hover:border-primary/50"
                    >
                      <Rotate90 className="h-4 w-4 mr-2" />
                      Right
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 flex items-center">
                    <Sun className="h-4 w-4 mr-2" />
                    Brightness: {brightness}
                  </Label>
                  <Input
                    type="range"
                    min="-100"
                    max="100"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="mb-2 flex items-center">
                    <Contrast className="h-4 w-4 mr-2" />
                    Contrast: {contrast}
                  </Label>
                  <Input
                    type="range"
                    min="-100"
                    max="100"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                  />
                </div>

                <div>
                  <Label className="mb-3 block font-semibold">Signature</Label>
                  <Button
                    variant="outline"
                    onClick={() => setShowSignaturePad(true)}
                    className="w-full hover:bg-secondary/80 hover:border-primary/50"
                  >
                    <FileSignature className="h-4 w-4 mr-2" />
                    Add Signature
                  </Button>
                </div>

                {signatureDataUrl && (
                  <div className="space-y-2">
                    <Label>Signature Position</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Horizontal: {signaturePosition.x}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={signaturePosition.x}
                          onChange={(e) => setSignaturePosition({ ...signaturePosition, x: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Vertical: {signaturePosition.y}%</Label>
                        <Input
                          type="range"
                          min="0"
                          max="100"
                          value={signaturePosition.y}
                          onChange={(e) => setSignaturePosition({ ...signaturePosition, y: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSignatureDataUrl(null)}
                      className="w-full"
                    >
                      Remove Signature
                    </Button>
                  </div>
                )}
              </Card>

              {processedImage ? (
                <div
                  className={`rounded-lg overflow-hidden border border-border relative ${signatureDataUrl ? 'cursor-crosshair' : ''}`}
                  onClick={(e) => {
                    if (!signatureDataUrl) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setSignaturePosition({ x, y });
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto hidden"
                  />
                  <img
                    src={signatureDataUrl ? canvasRef.current?.toDataURL() || processedImage : processedImage}
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

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] glass border-t border-border/50">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 hover:bg-secondary/80 hover:border-primary/50"
              onClick={handleSaveJPG}
              disabled={isProcessing || !documentName.trim()}
            >
              <Download className="mr-2 h-4 w-4" />
              Export JPG
            </Button>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
              onClick={onCancel}
              disabled={isProcessing}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              size="lg"
              className="flex-[2] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all font-semibold"
              onClick={handleSave}
              disabled={isProcessing || !documentName.trim()}
            >
              <Save className="mr-2 h-5 w-5" />
              {isProcessing ? 'Saving...' : 'Save as PDF'}
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
