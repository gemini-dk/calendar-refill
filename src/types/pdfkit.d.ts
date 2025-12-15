declare module "pdfkit" {
  import { Readable } from "stream";

  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
  }

  class PDFDocument extends Readable {
    constructor(options?: PDFDocumentOptions);
    addPage(options?: PDFDocumentOptions): this;
    circle(x: number, y: number, radius: number): this;
    end(): void;
    fillAndStroke(fillColor?: string | number, strokeColor?: string | number): this;
    fillColor(color: string | number): this;
    fontSize(size: number): this;
    lineTo(x: number, y: number): this;
    lineWidth(width: number): this;
    moveTo(x: number, y: number): this;
    rect(x: number, y: number, width: number, height: number): this;
    stroke(color?: string | number): this;
    text(text: string, x?: number, y?: number, options?: Record<string, unknown>): this;
    page: { width: number; height: number };
  }

  export = PDFDocument;
}
