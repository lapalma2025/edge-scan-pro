import { useRef, useState, useEffect } from 'react';
import { Point } from '@/lib/opencv-utils';
import { Button } from './ui/button';
import { Check, X } from 'lucide-react';

interface CornerEditorProps {
  imageDataUrl: string;
  initialCorners: Point[];
  onConfirm: (corners: Point[]) => void;
  onCancel: () => void;
}

export const CornerEditor = ({
  imageDataUrl,
  initialCorners,
  onConfirm,
  onCancel
}: CornerEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [corners, setCorners] = useState<Point[]>(initialCorners);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      
      if (containerRef.current && canvasRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight - 100;
        const scaleX = containerWidth / img.width;
        const scaleY = containerHeight / img.height;
        const newScale = Math.min(scaleX, scaleY, 1);
        setScale(newScale);
        
        canvasRef.current.width = img.width * newScale;
        canvasRef.current.height = img.height * newScale;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
          drawCorners(ctx, corners, newScale);
        }
      }
    };
    img.src = imageDataUrl;
  }, [imageDataUrl]);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        // Redraw image
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
          drawCorners(ctx, corners, scale);
        };
        img.src = imageDataUrl;
      }
    }
  }, [corners, scale]);

  const drawCorners = (ctx: CanvasRenderingContext2D, pts: Point[], s: number) => {
    if (pts.length !== 4) return;

    // Draw lines
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x * s, pts[0].y * s);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x * s, pts[i].y * s);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw handles
    pts.forEach((pt, i) => {
      ctx.fillStyle = draggingIndex === i ? '#059669' : '#10b981';
      ctx.beginPath();
      ctx.arc(pt.x * s, pt.y * s, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(pt.x * s, pt.y * s, 6, 0, 2 * Math.PI);
      ctx.fill();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const index = corners.findIndex(corner => {
      const dx = corner.x - x;
      const dy = corner.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 20;
    });

    if (index !== -1) {
      setDraggingIndex(index);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingIndex === null || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    const newCorners = [...corners];
    newCorners[draggingIndex] = {
      x: Math.max(0, Math.min(imageSize.width, x)),
      y: Math.max(0, Math.min(imageSize.height, y))
    };
    setCorners(newCorners);
  };

  const handleMouseUp = () => {
    setDraggingIndex(null);
  };

  return (
    <div ref={containerRef} className="fixed inset-0 bg-background z-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            handleMouseDown(touch as any);
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            handleMouseMove(touch as any);
          }}
          onTouchEnd={handleMouseUp}
        />
      </div>
      
      <div className="p-4 bg-card border-t border-border">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => onConfirm(corners)}
          >
            <Check className="mr-2 h-4 w-4" />
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
