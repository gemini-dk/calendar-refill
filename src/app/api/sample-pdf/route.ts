import PDFDocument from "pdfkit";
import { drawA5Weekly1 } from "@/lib/templates/a5Weekly1";
import { a5SizePt, renderPdfToBuffer } from "@/lib/pdfutils";

export const runtime = "nodejs";

export async function GET() {
  const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
  const pdf = await renderPdfToBuffer(doc, () => {
    doc.addPage({ size: a5SizePt(), margin: 0 });
    drawA5Weekly1(doc, {
      pageNumber: 1,
      startDateUtc: new Date(Date.UTC(2025, 3, 7)), // 2025/04/07 (Mon)
    });
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="a5-weekly1-2025-04-07.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
