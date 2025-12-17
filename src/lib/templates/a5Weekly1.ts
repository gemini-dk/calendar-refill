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

const HEADER_HEIGHT_MM = 7;
const HEADER_FONT_SIZE_PT = 12;
const HEADER_YEAR_FONT_SIZE_PT = 8;
const DATE_FONT_SIZE_PT = 20;
const WEEKDAY_FONT_SIZE_PT = 10;

const GRID_LINE_WIDTH_THIN = 0.4;
const GRID_LINE_WIDTH_THICK = 0.9;

// リフィル向けに「真っ黒/真っ赤」を避けた配色
const COLOR_TEXT_DEFAULT = "#3F3F46"; // dark gray
const COLOR_GRID = "#D4D4D8"; // light gray
const COLOR_SAT = "#4A6A8A"; // muted blue
const COLOR_SUN = "#8A4A4A"; // muted red

const CELL_PADDING_MM = 0;
const DAY_LABEL_PADDING_TOP_MM = 1.5;
const DAY_LABEL_WIDTH_MM = 9;
const WEEKDAY_GAP_MM = 0;
const EVENT_FONT_SIZE_PT = 7;
const EVENT_BOTTOM_PADDING_MM = 1.5;
const HOLIDAY_EVENT_GAP_MM = 0;
const HEADER_YEAR_GAP_MM = 1.2;

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

const yearLabelForRangeUtc = (startUtc: Date, days: number) => {
  const years: number[] = [];
  for (let i = 0; i < days; i++) {
    const d = addDaysUtc(startUtc, i);
    const y = d.getUTCFullYear();
    if (!years.includes(y)) years.push(y);
  }
  return years.join("/");
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
  const notoSansJpMedium = path.join(
    fontsDir,
    "Noto_Sans_JP",
    "NotoSansJP-Medium.ttf",
  );

  const hasPlayfair = registerFontIfExists(doc, "pfMedium", playfairMedium);
  const hasMontserrat = registerFontIfExists(doc, "msMedium", montserratMedium);
  const hasGothic = registerFontIfExists(doc, "jpGothic", notoSansJpMedium);

  doc.save();
  doc.strokeColor(COLOR_GRID);

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

  // Header text (year + month name(s))
  const yearLabel = yearLabelForRangeUtc(options.startDateUtc, 7);
  const monthLabel = monthLabelForRangeUtc(options.startDateUtc, 7);
  const headerX = left + mmToPt(CELL_PADDING_MM);
  const headerCenterY = top + headerHeight / 2;

  if (hasPlayfair) doc.font("pfMedium");
  doc.fillColor(COLOR_TEXT_DEFAULT).fontSize(HEADER_FONT_SIZE_PT);
  const monthLineHeight = doc.currentLineHeight(true);

  if (hasPlayfair) doc.font("pfMedium");
  doc.fillColor(COLOR_TEXT_DEFAULT).fontSize(HEADER_YEAR_FONT_SIZE_PT);
  const yearLineHeight = doc.currentLineHeight(true);

  const monthY = headerCenterY - monthLineHeight / 2;
  const yearY = monthY + monthLineHeight - yearLineHeight;

  doc.text(yearLabel, headerX, yearY, { lineBreak: false });
  const yearWidth = doc.widthOfString(yearLabel);

  if (hasPlayfair) doc.font("pfMedium");
  doc.fillColor(COLOR_TEXT_DEFAULT).fontSize(HEADER_FONT_SIZE_PT);
  doc.text(monthLabel, headerX + yearWidth + mmToPt(HEADER_YEAR_GAP_MM), monthY, {
    lineBreak: false,
  });

  const holidayByIndex: Partial<Record<number, string>> = {
    3: "勤労感謝の日",
  };

  const eventsByIndex: Partial<Record<number, string>> = {
    0: "春休み",
    1: "春休み",
    2: "前期 水曜授業 (1)",
    3: "前期 木曜授業 (1)",
    4: "前期 金曜授業 (1)",
    5: "前期 土曜授業 (1)",
    6: "前期 日曜",
  };

  // Day rows: Monday (top) -> Sunday (bottom)
  for (let i = 0; i < 7; i++) {
    const dateUtc = addDaysUtc(options.startDateUtc, i);
    const dayOfMonth = dateUtc.getUTCDate();

    const rowY = gridTop + rowHeight * i;
    const x = left + mmToPt(CELL_PADDING_MM);
    const y = rowY + mmToPt(DAY_LABEL_PADDING_TOP_MM);
    const labelWidth = mmToPt(DAY_LABEL_WIDTH_MM);

    if (hasMontserrat) doc.font("msMedium");
    if (i === 5) doc.fillColor(COLOR_SAT);
    else if (i === 6) doc.fillColor(COLOR_SUN);
    else doc.fillColor(COLOR_TEXT_DEFAULT);
    doc.fontSize(DATE_FONT_SIZE_PT);
    const dateLineHeight = doc.currentLineHeight(true);
    doc.text(String(dayOfMonth), x, y, {
      width: labelWidth,
      align: "center",
      lineBreak: false,
    });

    doc.fontSize(WEEKDAY_FONT_SIZE_PT);
    const weekdayLineHeight = doc.currentLineHeight(true);
    doc.text(weekday3[i], x, y + dateLineHeight + mmToPt(WEEKDAY_GAP_MM), {
      width: labelWidth,
      align: "center",
      lineBreak: false,
    });

    const eventText = eventsByIndex[i];
    if (eventText) {
      doc.fillColor(COLOR_TEXT_DEFAULT);
      if (hasGothic) doc.font("jpGothic");
      doc.fontSize(EVENT_FONT_SIZE_PT);
      const eventLineHeight = doc.currentLineHeight(true);
      const rowBottomY = rowY + rowHeight;
      const eventY = rowBottomY - mmToPt(EVENT_BOTTOM_PADDING_MM) - eventLineHeight;

      const holidayText = holidayByIndex[i];
      if (holidayText) {
        const holidayY = eventY - mmToPt(HOLIDAY_EVENT_GAP_MM) - eventLineHeight;
        doc.text(holidayText, x, holidayY, {
          width: contentWidth,
          align: "left",
          lineBreak: false,
        });
      }

      doc.text(eventText, x, eventY, {
        width: contentWidth,
        align: "left",
        lineBreak: false,
      });
    }
  }

  doc.restore();
};
