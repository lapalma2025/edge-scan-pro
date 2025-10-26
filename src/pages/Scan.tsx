import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Square } from 'lucide-react';
import { captureImage, vibrate } from '@/lib/capacitor-utils';
import { detectDocumentEdges, loadOpenCV, Point } from '@/lib/opencv-utils';
import { CornerEditor } from '@/components/CornerEditor';
import { drawDetectionOverlay } from '@/components/EdgeDetectionOverlay';
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
        toast({
          title: 'Image Captured',
          description: 'Processing without edge detection'
        });
        onImageCaptured(imageDataUrl, []);
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
          <div className="relative w-full aspect-[3/4] bg-muted rounded-2xl overflow-hidden border-2 border-dashed border-border">
            <div className="absolute inset-0 flex items-center justify-center">
              <Square className="h-32 w-32 text-muted-foreground opacity-20" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground text-center px-4">
                Position document within frame
              </p>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCapture}
            disabled={isLoading}
            className="w-full max-w-xs h-14 text-lg bg-primary hover:bg-primary/90"
          >
            <Camera className="mr-2 h-6 w-6" />
            {isLoading ? 'Capturing...' : 'Capture Document'}
          </Button>

          {!opencvReady && (
            <p className="text-xs text-muted-foreground text-center">
              Loading edge detection...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
