import { NextRequest } from "next/server";

const beige = "#fdf8f2";
const accent = "#22c55e";
const line = "#e5e7eb";
const textColor = "#0f172a";
const muted = "#6b7280";
const pageWidth = 595.28; // A4 width in points
const pageHeight = 841.89; // A4 height in points

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
type PageOptions = { dateAlign: "left" | "right"; holeSide: "left" | "right" };

type RGB = { r: number; g: number; b: number };

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

function escapeText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textCommand(text: string, x: number, y: number, size: number) {
  const safe = escapeText(text);
  return `BT /F1 ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${safe}) Tj ET\n`;
}

function setStroke(rgb: RGB) {
  return `${rgb.r.toFixed(4)} ${rgb.g.toFixed(4)} ${rgb.b.toFixed(4)} RG\n`;
}

function setFill(rgb: RGB) {
  return `${rgb.r.toFixed(4)} ${rgb.g.toFixed(4)} ${rgb.b.toFixed(4)} rg\n`;
}

function drawRoundedRect(x: number, y: number, w: number, h: number, radius: number) {
  const k = 0.552284749831; // Approximates a circle using bezier curves
  const cr = radius * k;
  const path = [
    `${(x + radius).toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + w - radius).toFixed(2)} ${y.toFixed(2)} l`,
    `${(x + w - radius + cr).toFixed(2)} ${(y + cr).toFixed(2)} ${(x + w).toFixed(2)} ${(y + radius - cr).toFixed(2)} ${(x + w).toFixed(2)} ${(y + radius).toFixed(2)} c`,
    `${(x + w).toFixed(2)} ${(y + h - radius).toFixed(2)} l`,
    `${(x + w).toFixed(2)} ${(y + h - radius + cr).toFixed(2)} ${(x + w - radius + cr).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - radius).toFixed(2)} ${(y + h).toFixed(2)} c`,
    `${(x + radius).toFixed(2)} ${(y + h).toFixed(2)} l`,
    `${(x + radius - cr).toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - radius + cr).toFixed(2)} ${x.toFixed(2)} ${(y + h - radius).toFixed(2)} c`,
    `${x.toFixed(2)} ${(y + radius).toFixed(2)} l`,
    `${x.toFixed(2)} ${(y + radius - cr).toFixed(2)} ${(x + radius - cr).toFixed(2)} ${(y + cr).toFixed(2)} ${(x + radius).toFixed(2)} ${y.toFixed(2)} c`,
    "h",
  ];
  return path.join("\n") + "\n";
}

function drawCircle(x: number, y: number, radius: number) {
  const k = 0.552284749831;
  const ox = radius * k;
  const oy = radius * k;
  const path = [
    `${(x + radius).toFixed(2)} ${y.toFixed(2)} m`,
    `${(x + radius).toFixed(2)} ${(y + oy).toFixed(2)} ${(x + ox).toFixed(2)} ${(y + radius).toFixed(2)} ${x.toFixed(2)} ${(y + radius).toFixed(2)} c`,
    `${(x - ox).toFixed(2)} ${(y + radius).toFixed(2)} ${(x - radius).toFixed(2)} ${(y + oy).toFixed(2)} ${(x - radius).toFixed(2)} ${y.toFixed(2)} c`,
    `${(x - radius).toFixed(2)} ${(y - oy).toFixed(2)} ${(x - ox).toFixed(2)} ${(y - radius).toFixed(2)} ${x.toFixed(2)} ${(y - radius).toFixed(2)} c`,
    `${(x + ox).toFixed(2)} ${(y - radius).toFixed(2)} ${(x + radius).toFixed(2)} ${(y - oy).toFixed(2)} ${(x + radius).toFixed(2)} ${y.toFixed(2)} c`,
    "h",
  ];
  return path.join("\n") + "\n";
}

function drawHoles(commands: string[], x: number, margin: number) {
  const usableHeight = pageHeight - margin * 2;
  const holeCount = 6;
  const spacing = usableHeight / (holeCount - 1);
  const stroke = setStroke(hexToRgb(textColor));
  const fill = setFill(hexToRgb("#ffffff"));

  commands.push(stroke);
  commands.push("1.4 w\n");
  commands.push(fill);

  for (let i = 0; i < holeCount; i++) {
    const y = margin + i * spacing;
    const cy = pageHeight - y - 6; // circle center from bottom
    commands.push(drawCircle(x, cy, 6));
    commands.push("S\n");
  }
}

function drawPage(cells: Cell[], margin: number, baseDate: Date, options: PageOptions) {
  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - margin * 2;
  const cellHeight = usableHeight / cells.length;
  const content: string[] = [];

  const accentRgb = hexToRgb(accent);
  const lineRgb = hexToRgb(line);
  const beigeRgb = hexToRgb(beige);
  const mutedRgb = hexToRgb(muted);
  const textRgb = hexToRgb(textColor);

  // Accent bars
  content.push(setStroke(accentRgb));
  content.push("2.4 w\n");
  const topAccentY = pageHeight - (margin - 12);
  const bottomAccentY = pageHeight - (pageHeight - margin + 12);
  content.push(`${margin.toFixed(2)} ${topAccentY.toFixed(2)} m ${(pageWidth - margin).toFixed(2)} ${topAccentY.toFixed(2)} l S\n`);
  content.push(`${margin.toFixed(2)} ${bottomAccentY.toFixed(2)} m ${(pageWidth - margin).toFixed(2)} ${bottomAccentY.toFixed(2)} l S\n`);

  // Cells
  cells.forEach((cell, index) => {
    const top = margin + index * cellHeight;
    const rectY = pageHeight - top - cellHeight;

    content.push(setFill(beigeRgb));
    content.push(setStroke(lineRgb));
    content.push("1.2 w\n");
    content.push(drawRoundedRect(margin, rectY, usableWidth, cellHeight, 8));
    content.push("B\n");

    const dateText = formatDate(baseDate, cell.offset);
    const dateX = options.dateAlign === "right" ? margin + usableWidth - 54 : margin + 12;
    const dateY = pageHeight - (top + 16);
    content.push(setFill(mutedRgb));
    content.push(textCommand(dateText, dateX, dateY, 10));

    const labelX = margin + 18;
    const labelY = pageHeight - (top + cellHeight / 2 + 6);
    content.push(setFill(textRgb));
    content.push(textCommand(cell.label, labelX, labelY, 20));
  });

  const holeX = options.holeSide === "left" ? margin - 18 : pageWidth - margin + 18;
  drawHoles(content, holeX, margin);

  return content.join("");
}

function buildPdf() {
  const baseDate = startOfWeek(new Date());
  const margin = 52;

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

  const page1Content = drawPage(leftCells, margin, baseDate, { dateAlign: "right", holeSide: "right" });
  const page2Content = drawPage(rightCells, margin, baseDate, { dateAlign: "left", holeSide: "left" });

  const objects: string[] = [];
  const addObject = (content: string) => {
    const id = objects.length + 1;
    objects.push(`${id} 0 obj\n${content}\nendobj\n`);
    return id;
  };

  const fontObj = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const streamObject = (content: string) => {
    const lengthObj = addObject(`${Buffer.byteLength(content, "utf8")}`);
    return addObject(`<< /Length ${lengthObj} 0 R >>\nstream\n${content}endstream`);
  };

  const page1Stream = streamObject(page1Content);
  const page2Stream = streamObject(page2Content);

  const page1 = addObject(
    `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${page1Stream} 0 R >>`
  );
  const page2 = addObject(
    `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${page2Stream} 0 R >>`
  );

  const pages = addObject(`<< /Type /Pages /Kids [${page1} 0 R ${page2} 0 R] /Count 2 >>`);

  // Patch parent references now that pages id is known
  objects[page1 - 1] = objects[page1 - 1].replace("0 0 R", `${pages} 0 R`);
  objects[page2 - 1] = objects[page2 - 1].replace("0 0 R", `${pages} 0 R`);

  const catalog = addObject(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
  let offset = 0;
  const xrefEntries = ["0000000000 65535 f \n"];
  const parts: string[] = [];

  objects.forEach((obj) => {
    xrefEntries.push(offset.toString().padStart(10, "0") + " 00000 n \n");
    parts.push(obj);
    offset += Buffer.byteLength(obj, "utf8");
  });

  const xrefStart = offset;
  parts.push(`xref\n0 ${objects.length + 1}\n${xrefEntries.join("")}`);
  parts.push("trailer\n");
  parts.push(`<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\n`);
  parts.push("startxref\n");
  parts.push(`${xrefStart}\n%%EOF`);

  return Buffer.from(parts.join(""), "utf8");
}

export async function GET(_req: NextRequest) {
  const pdfBuffer = buildPdf();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=weekly-planner.pdf",
    },
  });
}
