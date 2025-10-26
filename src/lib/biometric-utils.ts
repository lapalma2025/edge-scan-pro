import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { Capacitor } from '@capacitor/core';

export interface BiometricCheckResult {
  isAvailable: boolean;
  biometryType?: 'TouchID' | 'FaceID' | 'Fingerprint' | 'Face' | 'Iris';
  strongBiometryIsAvailable?: boolean;
}

export const checkBiometricAvailability = async (): Promise<BiometricCheckResult> => {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false };
  }

  try {
    const result = await BiometricAuth.checkBiometry();
    return {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType as any,
      strongBiometryIsAvailable: result.strongBiometryIsAvailable
    };
  } catch (error) {
    console.error('Biometric check error:', error);
    return { isAvailable: false };
  }
};

export const authenticateWithBiometrics = async (
  reason: string = 'Authenticate to access your documents'
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    // Allow access in browser for testing
    return true;
  }

  try {
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Cancel',
      allowDeviceCredential: true,
      iosFallbackTitle: 'Use Passcode',
      androidTitle: 'Biometric Authentication',
      androidSubtitle: 'Authenticate to continue',
      androidConfirmationRequired: false,
    });
    return true;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
};
