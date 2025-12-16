import fs from "fs";
import { PassThrough } from "stream";

export const mmToPt = (mm: number) => (mm * 72) / 25.4;

export type PdfSize = [number, number];

export const a5SizePt = (): PdfSize => [mmToPt(148), mmToPt(210)];

export type PageMarginsPt = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const marginsA5Weekly1Pt = (pageNumber: number): PageMarginsPt => {
  const isOdd = pageNumber % 2 === 1;
  const top = mmToPt(10);
  const bottom = mmToPt(10);
  const inner = mmToPt(10);
  const outer = mmToPt(20);
  return isOdd
    ? { top, right: outer, bottom, left: inner }
    : { top, right: inner, bottom, left: outer };
};

export const registerFontIfExists = (
  doc: PDFKit.PDFDocument,
  name: string,
  fontPath: string,
) => {
  if (!fs.existsSync(fontPath)) return false;
  doc.registerFont(name, fontPath);
  return true;
};

export const renderPdfToBuffer = async (
  doc: PDFKit.PDFDocument,
  draw: () => void,
): Promise<Buffer> => {
  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  stream.on("data", (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.on("error", reject);
  });

  doc.pipe(stream);
  draw();
  doc.end();
  return done;
};
