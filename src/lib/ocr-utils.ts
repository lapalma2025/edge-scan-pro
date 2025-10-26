import { createWorker, Worker } from 'tesseract.js';

let worker: Worker | null = null;

export const initOCR = async (): Promise<void> => {
  if (worker) return;

  try {
    worker = await createWorker('pol+eng', 1, {
      logger: (m) => console.log('OCR:', m)
    });
  } catch (error) {
    console.error('Failed to initialize OCR:', error);
    throw error;
  }
};

export const performOCR = async (imageDataUrl: string): Promise<string> => {
  if (!worker) {
    await initOCR();
  }

  if (!worker) {
    throw new Error('OCR worker not initialized');
  }

  try {
    const { data: { text } } = await worker.recognize(imageDataUrl);
    return text;
  } catch (error) {
    console.error('OCR failed:', error);
    throw error;
  }
};

export const terminateOCR = async (): Promise<void> => {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
};
