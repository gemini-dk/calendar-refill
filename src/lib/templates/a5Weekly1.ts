import path from "path";
import {
  a5SizePt,
  marginsA5Weekly1Pt,
  mmToPt,
  registerFontIfExists,
} from "../pdfutils";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekday3 = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"] as const;

const HEADER_HEIGHT_MM = 8;
const HEADER_FONT_SIZE_PT = 15;
const DATE_FONT_SIZE_PT = 20;
const WEEKDAY_FONT_SIZE_PT = 10;

const GRID_LINE_WIDTH_THIN = 0.4;
const GRID_LINE_WIDTH_THICK = 0.9;

const CELL_PADDING_MM = 0;
const DAY_LABEL_PADDING_TOP_MM=1.5;
const DAY_LABEL_WIDTH_MM = 9;
const WEEKDAY_GAP_MM = 0;

const addDaysUtc = (dateUtc: Date, days: number) =>
  new Date(Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate() + days));

const monthLabelForRangeUtc = (startUtc: Date, days: number) => {
  const months: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysUtc(startUtc, i);
    const m = d.getUTCMonth();
    if (!months.includes(m)) months.push(m);
  }
  return months.map((m) => monthNames[m]).join(",");
};

export type A5Weekly1Options = {
  pageNumber: number;
  startDateUtc: Date; // Monday
};

export const drawA5Weekly1 = (doc: PDFKit.PDFDocument, options: A5Weekly1Options) => {
  const [pageWidth, pageHeight] = a5SizePt();
  const margins = marginsA5Weekly1Pt(options.pageNumber);

  const left = margins.left;
  const top = margins.top;
  const contentWidth = pageWidth - margins.left - margins.right;
  const contentHeight = pageHeight - margins.top - margins.bottom;

  const headerHeight = mmToPt(HEADER_HEIGHT_MM);
  const gridTop = top + headerHeight;
  const gridHeight = contentHeight - headerHeight;
  const rowHeight = gridHeight / 7;

  const fontsDir = path.join(process.cwd(), "resources", "fonts");
  const playfairMedium = path.join(
    fontsDir,
    "Playfair_Display",
    "PlayfairDisplay-Medium.ttf",
  );
  const montserratMedium = path.join(fontsDir, "Montserrat", "Montserrat-Medium.ttf");

  const hasPlayfair = registerFontIfExists(doc, "pfMedium", playfairMedium);
  const hasMontserrat = registerFontIfExists(doc, "msMedium", montserratMedium);

  doc.save();
  doc.strokeColor("#000000");

  // Horizontal lines only
  const hLine = (y: number, width: number) => {
    doc.lineWidth(width);
    doc.moveTo(left, y).lineTo(left + contentWidth, y).stroke();
  };

  // 月曜の上（ヘッダ下の境界）を太線
  hLine(gridTop, GRID_LINE_WIDTH_THICK);

  // 日付の間の罫線（横棒のみ）
  for (let i = 1; i < 7; i++) {
    const y = gridTop + rowHeight * i;
    hLine(y, GRID_LINE_WIDTH_THIN);
  }

  // Grid bottom（最下部の締め線＝日曜の下）を太線
  hLine(gridTop + gridHeight, GRID_LINE_WIDTH_THICK);

  // Header text (month name(s))
  const monthLabel = monthLabelForRangeUtc(options.startDateUtc, 7);
  if (hasPlayfair) doc.font("pfMedium");
  doc.fillColor("#000000").fontSize(HEADER_FONT_SIZE_PT);
  const headerTextY = top + headerHeight / 2 - doc.currentLineHeight(true) / 2;
  doc.text(monthLabel, left + mmToPt(CELL_PADDING_MM), headerTextY, {
    lineBreak: false,
  });

  // Day rows: Monday (top) -> Sunday (bottom)
  if (hasMontserrat) doc.font("msMedium");
  for (let i = 0; i < 7; i++) {
    const dateUtc = addDaysUtc(options.startDateUtc, i);
    const dayOfMonth = dateUtc.getUTCDate();

    const rowY = gridTop + rowHeight * i;
    const x = left + mmToPt(CELL_PADDING_MM);
    const y = rowY + mmToPt(DAY_LABEL_PADDING_TOP_MM);
    const labelWidth = mmToPt(DAY_LABEL_WIDTH_MM);

    doc.fontSize(DATE_FONT_SIZE_PT);
    const dateLineHeight = doc.currentLineHeight(true);
    doc.text(String(dayOfMonth), x, y, {
      width: labelWidth,
      align: "center",
      lineBreak: false,
    });

    doc.fontSize(WEEKDAY_FONT_SIZE_PT);
    doc.text(weekday3[i], x, y + dateLineHeight + mmToPt(WEEKDAY_GAP_MM), {
      width: labelWidth,
      align: "center",
      lineBreak: false,
    });
  }

  doc.restore();
};
