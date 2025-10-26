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
    <div className="min-h-screen flex flex-col bg-background">
      <header className="glass border-b border-border/50 p-4 sticky top-0 z-40">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              Pro PDF Scanner
            </h1>
            <p className="text-xs text-muted-foreground">Document scanning made simple</p>
          </div>
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
