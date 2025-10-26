import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Moon, Globe, Trash2, FileDown, Info, Fingerprint, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { vibrate } from '@/lib/capacitor-utils';
import { checkBiometricAvailability } from '@/lib/biometric-utils';
import { ImpactStyle } from '@capacitor/haptics';

export const Settings = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [biometricLock, setBiometricLock] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  const [privateMode, setPrivateMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkBiometrics();
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  const checkBiometrics = async () => {
    const result = await checkBiometricAvailability();
    setBiometricAvailable(result.isAvailable);
    if (result.biometryType) {
      setBiometricType(result.biometryType);
    }
  };

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
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 mb-4">
            <SettingsIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and privacy
          </p>
        </div>

        <Card className="card-modern p-5 border-0 space-y-5">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Moon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="dark-mode" className="font-medium cursor-pointer">Dark Mode</Label>
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

          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="biometric" className="font-medium cursor-pointer flex items-center gap-2">
                  Biometric Lock
                </Label>
                <p className="text-sm text-muted-foreground">
                  {biometricAvailable 
                    ? `Use ${biometricType || 'biometric'} authentication`
                    : 'Not available on this device'}
                </p>
              </div>
            </div>
            <Switch
              id="biometric"
              checked={biometricLock}
              onCheckedChange={setBiometricLock}
              disabled={!biometricAvailable}
            />
          </div>

          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label htmlFor="private-mode" className="font-medium cursor-pointer">Private Mode</Label>
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

        <Card className="card-modern p-5 border-0 space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-primary" />
            Language
          </h3>
          <Button variant="outline" className="w-full justify-start hover:bg-secondary/80 hover:border-primary/50">
            Polski / English
          </Button>
        </Card>

        <Card className="card-modern p-5 border-0 space-y-4">
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <FileDown className="h-5 w-5 text-primary" />
            Data Management
          </h3>
          <Button
            variant="outline"
            className="w-full justify-start hover:bg-secondary/80 hover:border-primary/50"
            onClick={handleExportBackup}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Export Encrypted Backup
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:bg-destructive/10 hover:border-destructive/50"
            onClick={handleDeleteAllData}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Data
          </Button>
        </Card>

        <Card className="card-modern p-5 border-0">
          <h3 className="font-semibold flex items-center gap-2 mb-3 text-base">
            <Info className="h-5 w-5 text-primary" />
            Privacy Policy
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Pro PDF Scanner operates 100% offline. No data is sent to any server
            without your explicit action (sharing/exporting). All processing happens
            on your device.
          </p>
          <div className="space-y-2.5 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Images are processed locally using WebAssembly
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              OCR runs entirely on your device
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              Documents stored in local IndexedDB
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              No analytics or tracking
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              GDPR & RODO compliant
            </p>
          </div>
        </Card>

        <div className="text-center text-sm text-muted-foreground py-6 space-y-1">
          <p className="font-semibold text-foreground">Pro PDF Scanner</p>
          <p>Version 1.0.0</p>
          <p>© 2025 - Privacy First</p>
        </div>
      </div>
    </div>
  );
};
