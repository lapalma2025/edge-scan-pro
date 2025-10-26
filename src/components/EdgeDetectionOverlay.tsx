import { Point } from '@/lib/opencv-utils';

interface EdgeDetectionOverlayProps {
  corners: Point[];
  canvasRef: React.RefObject<HTMLCanvasElement>;
  imageWidth: number;
  imageHeight: number;
}

export const EdgeDetectionOverlay = ({
  corners,
  canvasRef,
  imageWidth,
  imageHeight
}: EdgeDetectionOverlayProps) => {
  return (
    <canvas
      ref={canvasRef}
      width={imageWidth}
      height={imageHeight}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        mixBlendMode: 'screen'
      }}
    />
  );
};

export const drawDetectionOverlay = (
  canvas: HTMLCanvasElement,
  corners: Point[],
  color: string = '#10b981'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx || corners.length !== 4) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw lines connecting corners
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(corners[0].x, corners[0].y);
  for (let i = 1; i < corners.length; i++) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  ctx.closePath();
  ctx.stroke();

  // Draw corner circles
  ctx.fillStyle = color;
  corners.forEach(corner => {
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
    ctx.fill();
  });
};
