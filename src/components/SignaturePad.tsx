import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Pen, Type, Eraser, Check, X } from 'lucide-react';

interface SignaturePadProps {
  onConfirm: (signatureDataUrl: string) => void;
  onCancel: () => void;
}

export const SignaturePad = ({ onConfirm, onCancel }: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'draw' | 'text'>('draw');
  const [textColor, setTextColor] = useState('#000000');
  const [fontSize, setFontSize] = useState(48);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 300;

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const generateTextSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    ctx.fillStyle = textColor;
    ctx.font = `${fontSize}px "Brush Script MT", cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (mode === 'text') {
      generateTextSignature();
      // Wait a bit for text to render
      setTimeout(() => {
        const dataUrl = canvas.toDataURL('image/png');
        onConfirm(dataUrl);
      }, 100);
    } else {
      const dataUrl = canvas.toDataURL('image/png');
      onConfirm(dataUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col p-4">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold mb-4">Add Signature</h2>

        <Tabs value={mode} onValueChange={(v) => setMode(v as 'draw' | 'text')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="draw">
              <Pen className="h-4 w-4 mr-2" />
              Draw
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="h-4 w-4 mr-2" />
              Type
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draw" className="space-y-4">
            <Card className="p-4 bg-card">
              <canvas
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg touch-none bg-white"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </Card>
            <Button
              variant="outline"
              onClick={clearCanvas}
              className="w-full"
            >
              <Eraser className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signature-text">Signature Text</Label>
              <Input
                id="signature-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your signature"
                className="text-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="text-color">Color</Label>
                <Input
                  id="text-color"
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-size">Size: {fontSize}px</Label>
                <Input
                  id="font-size"
                  type="range"
                  min="24"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                />
              </div>
            </div>

            <Card className="p-4 bg-card">
              <canvas
                ref={canvasRef}
                className="w-full border-2 border-border rounded-lg bg-white"
              />
            </Card>

            <Button
              variant="outline"
              onClick={generateTextSignature}
              className="w-full"
              disabled={!text.trim()}
            >
              <Type className="h-4 w-4 mr-2" />
              Generate Signature
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex gap-2 max-w-2xl mx-auto w-full mt-4">
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
          className="flex-1"
          onClick={handleConfirm}
        >
          <Check className="mr-2 h-4 w-4" />
          Add Signature
        </Button>
      </div>
    </div>
  );
};
