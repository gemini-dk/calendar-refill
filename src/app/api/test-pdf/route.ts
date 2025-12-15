import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";

const beige = "#fdf8f2";
const accent = "#22c55e";
const line = "#e5e7eb";
const textColor = "#0f172a";
const muted = "#6b7280";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - ((day + 6) % 7); // Monday as start
  return new Date(d.setDate(diff));
}

function formatDate(base: Date, offset: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

type Cell = { label: string; offset: number };

function drawHoles(doc: PDFDocument, x: number, margin: number) {
  const pageHeight = doc.page.height;
  const usableHeight = pageHeight - margin * 2;
  const holeCount = 6;
  const spacing = usableHeight / (holeCount - 1);

  for (let i = 0; i < holeCount; i++) {
    const y = margin + i * spacing;
    doc.circle(x, y, 6).lineWidth(1.4).stroke(textColor);
  }
}

function drawPage(
  doc: PDFDocument,
  cells: Cell[],
  margin: number,
  baseDate: Date,
  options: { dateAlign: "left" | "right"; holeSide: "left" | "right" }
) {
  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const cellHeight = usableHeight / cells.length;

  // Accent bars
  doc
    .moveTo(margin, margin - 12)
    .lineTo(pageWidth - margin, margin - 12)
    .lineWidth(2.4)
    .stroke(accent);
  doc
    .moveTo(margin, pageHeight - margin + 12)
    .lineTo(pageWidth - margin, pageHeight - margin + 12)
    .lineWidth(2.4)
    .stroke(accent);

  cells.forEach((cell, index) => {
    const y = margin + index * cellHeight;

    doc.rect(margin, y, usableWidth, cellHeight).fillAndStroke(beige, line);

    const dateText = formatDate(baseDate, cell.offset);
    const dateX =
      options.dateAlign === "right" ? margin + usableWidth - 54 : margin + 12;

    doc
      .fontSize(10)
      .fillColor(muted)
      .text(dateText, dateX, y + 8, {
        width: 48,
        align: options.dateAlign,
      });

    doc.fontSize(20).fillColor(textColor).text(cell.label, margin + 18, y + cellHeight / 2 - 12);
  });

  const holeX = options.holeSide === "left" ? margin - 18 : pageWidth - margin + 18;
  drawHoles(doc, holeX, margin);
}

function createPlannerPdf() {
  const doc = new PDFDocument({ size: "A4", margin: 46 });

  const baseDate = startOfWeek(new Date());
  const leftCells: Cell[] = [
    { label: "月", offset: 0 },
    { label: "火", offset: 1 },
    { label: "水", offset: 2 },
    { label: "木", offset: 3 },
  ];
  const rightCells: Cell[] = [
    { label: "木", offset: 3 },
    { label: "金", offset: 4 },
    { label: "土", offset: 5 },
    { label: "空き", offset: 6 },
  ];

  drawPage(doc, leftCells, 52, baseDate, { dateAlign: "right", holeSide: "right" });
  doc.addPage();
  drawPage(doc, rightCells, 52, baseDate, { dateAlign: "left", holeSide: "left" });

  doc.end();
  return doc;
}

async function streamToBuffer(doc: PDFDocument) {
  const chunks: Buffer[] = [];
  return new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

export async function GET(_req: NextRequest) {
  const doc = createPlannerPdf();
  const pdfBuffer = await streamToBuffer(doc);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=weekly-planner.pdf",
    },
  });
}
