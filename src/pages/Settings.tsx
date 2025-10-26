import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Moon, Globe, Trash2, FileDown, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { vibrate } from '@/lib/capacitor-utils';
import { ImpactStyle } from '@capacitor/haptics';

export const Settings = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [biometricLock, setBiometricLock] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const { toast } = useToast();

  const handleDeleteAllData = async () => {
    if (!confirm('Are you sure you want to delete all data? This cannot be undone.')) {
      return;
    }

    try {
      await vibrate(ImpactStyle.Heavy);
      await db.documents.clear();
      toast({
        title: 'Data Deleted',
        description: 'All documents have been removed'
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete data',
        variant: 'destructive'
      });
    }
  };

  const handleExportBackup = () => {
    toast({
      title: 'Coming Soon',
      description: 'Encrypted backup export will be available soon'
    });
  };

  return (
    <div className="flex-1 overflow-y-auto pb-20 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and privacy
          </p>
        </div>

        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Use dark theme
                </p>
              </div>
            </div>
            <Switch
              id="dark-mode"
              checked={darkMode}
              onCheckedChange={(checked) => {
                setDarkMode(checked);
                document.documentElement.classList.toggle('dark', checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="biometric">Biometric Lock</Label>
                <p className="text-sm text-muted-foreground">
                  Require FaceID/TouchID
                </p>
              </div>
            </div>
            <Switch
              id="biometric"
              checked={biometricLock}
              onCheckedChange={setBiometricLock}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="private-mode">Private Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Don't save thumbnails
                </p>
              </div>
            </div>
            <Switch
              id="private-mode"
              checked={privateMode}
              onCheckedChange={setPrivateMode}
            />
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language
          </h3>
          <Button variant="outline" className="w-full justify-start">
            Polski / English
          </Button>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Data Management
          </h3>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleExportBackup}
          >
            Export Encrypted Backup
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive"
            onClick={handleDeleteAllData}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Data
          </Button>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold flex items-center gap-2 mb-2">
            <Info className="h-5 w-5" />
            Privacy Policy
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pro PDF Scanner operates 100% offline. No data is sent to any server
            without your explicit action (sharing/exporting). All processing happens
            on your device.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Images are processed locally using WebAssembly</p>
            <p>• OCR runs entirely on your device</p>
            <p>• Documents stored in local IndexedDB</p>
            <p>• No analytics or tracking</p>
            <p>• GDPR & RODO compliant</p>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Pro PDF Scanner v1.0.0</p>
          <p>© 2025 - Privacy First</p>
        </div>
      </div>
    </div>
  );
};
