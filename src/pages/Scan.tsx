import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Square } from 'lucide-react';
import { captureImage, vibrate } from '@/lib/capacitor-utils';
import { detectDocumentEdges, loadOpenCV, Point } from '@/lib/opencv-utils';
import { CornerEditor } from '@/components/CornerEditor';
import { useToast } from '@/hooks/use-toast';
import { ImpactStyle } from '@capacitor/haptics';

interface ScanProps {
  onImageCaptured: (imageDataUrl: string, corners: Point[]) => void;
}

export const Scan = ({ onImageCaptured }: ScanProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedCorners, setDetectedCorners] = useState<Point[] | null>(null);
  const [showCornerEditor, setShowCornerEditor] = useState(false);
  const [opencvReady, setOpencvReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadOpenCV()
      .then(() => {
        setOpencvReady(true);
        console.log('OpenCV loaded');
      })
      .catch((error) => {
        console.error('Failed to load OpenCV:', error);
        toast({
          title: 'OpenCV Loading Error',
          description: 'Edge detection will be limited',
          variant: 'destructive'
        });
      });

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  const handleCapture = async () => {
    try {
      setIsLoading(true);
      await vibrate(ImpactStyle.Medium);
      
      const imageDataUrl = await captureImage();
      setCapturedImage(imageDataUrl);

      // Detect edges
      if (opencvReady) {
        const img = new Image();
        img.onload = () => {
          const detected = detectDocumentEdges(img, 0.5);
          if (detected && detected.corners.length === 4) {
            setDetectedCorners(detected.corners);
            setShowCornerEditor(true);
          } else {
            // No edges detected, use full image
            const corners: Point[] = [
              { x: 0, y: 0 },
              { x: img.width, y: 0 },
              { x: img.width, y: img.height },
              { x: 0, y: img.height }
            ];
            setDetectedCorners(corners);
            setShowCornerEditor(true);
          }
        };
        img.src = imageDataUrl;
      } else {
        // Open manual corner editor with full-frame corners when OpenCV isn't ready
        const img = new Image();
        img.onload = () => {
          const corners: Point[] = [
            { x: 0, y: 0 },
            { x: img.width, y: 0 },
            { x: img.width, y: img.height },
            { x: 0, y: img.height }
          ];
          setDetectedCorners(corners);
          setShowCornerEditor(true);
        };
        img.src = imageDataUrl;
      }
    } catch (error) {
      console.error('Capture error:', error);
      toast({
        title: 'Capture Failed',
        description: 'Could not capture image',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCornerConfirm = (corners: Point[]) => {
    if (capturedImage) {
      onImageCaptured(capturedImage, corners);
      setShowCornerEditor(false);
      setCapturedImage(null);
      setDetectedCorners(null);
    }
  };

  const handleCornerCancel = () => {
    setShowCornerEditor(false);
    setCapturedImage(null);
    setDetectedCorners(null);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      {showCornerEditor && capturedImage && detectedCorners ? (
        <CornerEditor
          imageDataUrl={capturedImage}
          initialCorners={detectedCorners}
          onConfirm={handleCornerConfirm}
          onCancel={handleCornerCancel}
        />
      ) : (
        <div className="flex flex-col items-center gap-8 max-w-md w-full">
          <div className="relative w-full aspect-[3/4] card-modern rounded-3xl overflow-hidden border-2 border-dashed border-primary/30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <Square className="h-24 w-24 text-primary/40 relative z-10" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-foreground font-medium">
                  Position your document
                </p>
                <p className="text-sm text-muted-foreground">
                  Auto edge detection enabled
                </p>
              </div>
            </div>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <Button
              size="lg"
              onClick={handleCapture}
              disabled={isLoading}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
            >
              <Camera className="mr-2 h-6 w-6" />
              {isLoading ? 'Capturing...' : 'Scan Document'}
            </Button>

            {!opencvReady && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                Loading edge detection...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
