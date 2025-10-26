// OpenCV.js utilities for edge detection and perspective correction
// Load OpenCV.js from CDN in index.html

export interface Point {
  x: number;
  y: number;
}

export interface DetectedDocument {
  corners: Point[];
  confidence: number;
}

let cv: any = null;
let loadingPromise: Promise<void> | null = null;

export const loadOpenCV = (): Promise<void> => {
  // If already loaded, return immediately
  if (cv && (window as any).cv) {
    return Promise.resolve();
  }

  // If currently loading, return the existing promise
  if (loadingPromise) {
    return loadingPromise;
  }

  // Check if script already exists
  const existingScript = document.querySelector('script[src*="opencv.js"]');
  if (existingScript && (window as any).cv) {
    cv = (window as any).cv;
    return Promise.resolve();
  }

  // Start loading
  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore
      if (window.cv) {
        // @ts-ignore
        cv = window.cv;
        cv.onRuntimeInitialized = () => {
          console.log('OpenCV.js loaded successfully');
          loadingPromise = null;
          resolve();
        };
      } else {
        loadingPromise = null;
        reject(new Error('OpenCV.js failed to load'));
      }
    };
    
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Failed to load OpenCV.js script'));
    };
    
    // Only append if script doesn't exist
    if (!existingScript) {
      document.head.appendChild(script);
    }
  });

  return loadingPromise;
};

export const detectDocumentEdges = (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  downscale: number = 0.5
): DetectedDocument | null => {
  if (!cv) return null;

  try {
    // Create canvas if input is an image to avoid OpenCV imread issues
    let canvas: HTMLCanvasElement;
    if (imageElement instanceof HTMLImageElement) {
      canvas = document.createElement('canvas');
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(imageElement, 0, 0);
    } else {
      canvas = imageElement;
    }

    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    let blurred = new cv.Mat();
    let edges = new cv.Mat();
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    try {
      // Downscale for performance
      const dsize = new cv.Size(src.cols * downscale, src.rows * downscale);
      cv.resize(src, src, dsize, 0, 0, cv.INTER_AREA);

      // Convert to grayscale
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      // Blur to reduce noise
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      // Canny edge detection
      cv.Canny(blurred, edges, 50, 150);

      // Find contours
      cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

      // Find largest contour with 4 corners
      let maxArea = 0;
      let bestContour: any = null;

      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const area = cv.contourArea(contour);
        
        if (area > maxArea) {
          const peri = cv.arcLength(contour, true);
          const approx = new cv.Mat();
          cv.approxPolyDP(contour, approx, 0.02 * peri, true);

          if (approx.rows === 4) {
            maxArea = area;
            bestContour = approx;
          }
        }
      }

      if (bestContour && maxArea > (src.cols * src.rows * 0.1)) {
        const corners: Point[] = [];
        for (let i = 0; i < 4; i++) {
          corners.push({
            x: bestContour.data32S[i * 2] / downscale,
            y: bestContour.data32S[i * 2 + 1] / downscale
          });
        }

        // Sort corners: top-left, top-right, bottom-right, bottom-left
        const sortedCorners = sortCorners(corners);
        
        return {
          corners: sortedCorners,
          confidence: Math.min(maxArea / (src.cols * src.rows), 1.0)
        };
      }

      return null;
    } finally {
      src.delete();
      gray.delete();
      blurred.delete();
      edges.delete();
      contours.delete();
      hierarchy.delete();
    }
  } catch (error) {
    console.error('Edge detection error:', error);
    return null;
  }
};

export const sortCorners = (corners: Point[]): Point[] => {
  // Sort by sum (top-left has smallest sum, bottom-right has largest)
  const sorted = [...corners].sort((a, b) => (a.x + a.y) - (b.x + b.y));
  
  const topLeft = sorted[0];
  const bottomRight = sorted[3];
  
  // Sort remaining by difference (top-right has negative diff, bottom-left has positive)
  const remaining = [sorted[1], sorted[2]].sort((a, b) => (a.y - a.x) - (b.y - b.x));
  
  return [topLeft, remaining[0], bottomRight, remaining[1]];
};

export const applyPerspectiveTransform = (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  corners: Point[],
  width: number = 2000,
  height: number = 2800
): string => {
  if (!cv) return '';

  let src = cv.imread(imageElement);
  let dst = new cv.Mat();

  try {
    const srcCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
      corners[0].x, corners[0].y,
      corners[1].x, corners[1].y,
      corners[2].x, corners[2].y,
      corners[3].x, corners[3].y
    ]);

    const dstCorners = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      width, 0,
      width, height,
      0, height
    ]);

    const M = cv.getPerspectiveTransform(srcCorners, dstCorners);
    const dsize = new cv.Size(width, height);
    cv.warpPerspective(src, dst, M, dsize);

    // Convert to canvas and return data URL
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    srcCorners.delete();
    dstCorners.delete();
    M.delete();

    return dataUrl;
  } finally {
    src.delete();
    dst.delete();
  }
};

export const applyFilter = (
  imageDataUrl: string,
  filter: 'color' | 'grayscale' | 'bw'
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // If OpenCV is available, use it
      if (cv) {
        let src = cv.imread(img);
        let dst = new cv.Mat();
        try {
          switch (filter) {
            case 'grayscale':
              cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
              cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
              break;
            case 'bw':
              cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
              cv.adaptiveThreshold(
                dst,
                dst,
                255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv.THRESH_BINARY,
                11,
                2
              );
              cv.cvtColor(dst, dst, cv.COLOR_GRAY2RGBA);
              break;
            default:
              dst = src.clone();
          }
          const canvas = document.createElement('canvas');
          cv.imshow(canvas, dst);
          const result = canvas.toDataURL('image/jpeg', 0.95);
          resolve(result);
          return;
        } finally {
          src.delete();
          dst.delete();
        }
      }

      // Fallback to Canvas 2D processing when OpenCV is not loaded
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      if (filter === 'grayscale' || filter === 'bw') {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Luma calculation for grayscale
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          if (filter === 'bw') {
            const threshold = 128;
            const val = gray > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = val;
          } else {
            data[i] = data[i + 1] = data[i + 2] = gray;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    };
    img.src = imageDataUrl;
  });
};
