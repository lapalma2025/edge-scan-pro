import { Camera, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  activeTab: 'scan' | 'documents' | 'settings';
  onTabChange: (tab: 'scan' | 'documents' | 'settings') => void;
}

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <button
          onClick={() => onTabChange('scan')}
          className={cn(
            'flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all',
            activeTab === 'scan' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <Camera className={cn('h-5 w-5', activeTab === 'scan' && 'scale-110', 'transition-transform')} />
          <span className="text-xs font-medium">Scan</span>
        </button>
        
        <button
          onClick={() => onTabChange('documents')}
          className={cn(
            'flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all',
            activeTab === 'documents' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <FileText className={cn('h-5 w-5', activeTab === 'documents' && 'scale-110', 'transition-transform')} />
          <span className="text-xs font-medium">Documents</span>
        </button>
        
        <button
          onClick={() => onTabChange('settings')}
          className={cn(
            'flex flex-col items-center gap-1.5 px-6 py-2 rounded-xl transition-all',
            activeTab === 'settings' 
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
          )}
        >
          <Settings className={cn('h-5 w-5', activeTab === 'settings' && 'scale-110', 'transition-transform')} />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </nav>
  );
};
