import { PDFDocument, rgb } from 'pdf-lib';

export interface PDFPage {
  imageDataUrl: string;
  width: number;
  height: number;
}

export const createPDF = async (
  pages: PDFPage[],
  metadata?: {
    title?: string;
    author?: string;
    keywords?: string[];
  }
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  if (metadata) {
    if (metadata.title) pdfDoc.setTitle(metadata.title);
    if (metadata.author) pdfDoc.setAuthor(metadata.author);
    if (metadata.keywords) pdfDoc.setKeywords(metadata.keywords);
  }

  for (const pageData of pages) {
    const imageBytes = await fetch(pageData.imageDataUrl).then(res => res.arrayBuffer());
    const image = await pdfDoc.embedJpg(imageBytes);
    
    const page = pdfDoc.addPage([pageData.width, pageData.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pageData.width,
      height: pageData.height
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};

export const compressImage = (
  dataUrl: string,
  quality: number = 0.8,
  maxWidth: number = 2000,
  maxHeight: number = 2800
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Resize if needed
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
};

export const addTextLayerToPDF = async (
  pdfBytes: Uint8Array,
  pages: { text: string; bounds: { x: number; y: number; width: number; height: number } }[]
): Promise<Uint8Array> => {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pdfPages = pdfDoc.getPages();

  pages.forEach((pageData, index) => {
    if (index < pdfPages.length) {
      const page = pdfPages[index];
      const { width, height } = page.getSize();

      page.drawText(pageData.text, {
        x: pageData.bounds.x,
        y: height - pageData.bounds.y - pageData.bounds.height,
        size: 10,
        color: rgb(0, 0, 0),
        opacity: 0 // Invisible text layer for searchability
      });
    }
  });

  return await pdfDoc.save();
};
