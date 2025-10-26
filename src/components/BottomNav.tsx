import { Camera, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'scan' | 'documents' | 'settings';
  onTabChange: (tab: 'scan' | 'documents' | 'settings') => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        <button
          onClick={() => onTabChange('scan')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full transition-colors',
            activeTab === 'scan'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Camera className="h-6 w-6" />
          <span className="text-xs mt-1">Scan</span>
        </button>
        
        <button
          onClick={() => onTabChange('documents')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full transition-colors',
            activeTab === 'documents'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <FileText className="h-6 w-6" />
          <span className="text-xs mt-1">Documents</span>
        </button>
        
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            'flex flex-col items-center justify-center flex-1 h-full transition-colors',
            activeTab === 'settings'
              ? 'text-primary'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Settings className="h-6 w-6" />
          <span className="text-xs mt-1">Settings</span>
        </button>
      </div>
    </nav>
  );
};
