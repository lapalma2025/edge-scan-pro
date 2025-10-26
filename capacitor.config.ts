import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.2af7fa1ee5a84405ad7dd954de78851d',
  appName: 'edge-scan-pro',
  webDir: 'dist',
  server: {
    url: 'https://2af7fa1e-e5a8-4405-ad7d-d954de78851d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    Filesystem: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
