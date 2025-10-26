import Dexie, { Table } from 'dexie';

export interface Document {
  id?: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  pages: number;
  size: number;
  tags: string[];
  folder?: string;
  favorite: boolean;
  ocrText?: string;
  filePath: string;
  thumbnailPath?: string;
}

export class PDFScannerDB extends Dexie {
  documents!: Table<Document>;

  constructor() {
    super('PDFScannerDB');
    this.version(1).stores({
      documents: '++id, name, createdAt, folder, favorite, *tags'
    });
  }
}

export const db = new PDFScannerDB();
