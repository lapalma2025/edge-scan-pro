import { useState } from 'react';
import { BottomNav } from '@/components/BottomNav';
import { Scan } from './Scan';
import { Documents } from './Documents';
import { Settings } from './Settings';
import { Review } from './Review';
import { Point } from '@/lib/opencv-utils';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'scan' | 'documents' | 'settings'>('scan');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedCorners, setCapturedCorners] = useState<Point[]>([]);

  const handleImageCaptured = (imageDataUrl: string, corners: Point[]) => {
    setCapturedImage(imageDataUrl);
    setCapturedCorners(corners);
  };

  const handleReviewComplete = () => {
    setCapturedImage(null);
    setCapturedCorners([]);
    setActiveTab('documents');
  };

  const handleReviewCancel = () => {
    setCapturedImage(null);
    setCapturedCorners([]);
  };

  if (capturedImage) {
    return (
      <Review
        imageDataUrl={capturedImage}
        corners={capturedCorners}
        onComplete={handleReviewComplete}
        onCancel={handleReviewCancel}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background/95 to-background/90">
      <header className="bg-card border-b border-border p-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Pro PDF Scanner
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {activeTab === 'scan' && <Scan onImageCaptured={handleImageCaptured} />}
        {activeTab === 'documents' && <Documents />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
