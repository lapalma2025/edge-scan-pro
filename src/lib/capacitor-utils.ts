import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const captureImage = async (): Promise<string> => {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
    
    const image = await Camera.getPhoto({
      quality: 100,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      width: 2000,
      height: 2000,
      correctOrientation: true
    });

    return image.dataUrl!;
  } catch (error) {
    console.error('Error capturing image:', error);
    throw error;
  }
};

export const saveFile = async (
  data: string,
  fileName: string,
  directory: Directory = Directory.Documents
): Promise<string> => {
  try {
    const result = await Filesystem.writeFile({
      path: fileName,
      data: data,
      directory: directory,
      recursive: true
    });

    return result.uri;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

export const readFile = async (
  path: string,
  directory: Directory = Directory.Documents
): Promise<string> => {
  try {
    const result = await Filesystem.readFile({
      path: path,
      directory: directory
    });

    return result.data as string;
  } catch (error) {
    console.error('Error reading file:', error);
    throw error;
  }
};

export const deleteFile = async (
  path: string,
  directory: Directory = Directory.Documents
): Promise<void> => {
  try {
    await Filesystem.deleteFile({
      path: path,
      directory: directory
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const shareFile = async (
  filePath: string,
  title: string = 'Share PDF'
): Promise<void> => {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
    
    await Share.share({
      title: title,
      url: filePath,
      dialogTitle: title
    });
  } catch (error) {
    console.error('Error sharing file:', error);
    throw error;
  }
};

export const vibrate = async (style: ImpactStyle = ImpactStyle.Light): Promise<void> => {
  try {
    await Haptics.impact({ style });
  } catch (error) {
    console.error('Haptics not available:', error);
  }
};
