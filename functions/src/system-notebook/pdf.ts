import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { renderPdfToBuffer } from "./pdfutils";
import { a5SizePt, mmToPt } from "./pdfutils";
import { type A5Weekly1Day, drawA5Weekly1 } from "./templates/a5Weekly1";
import type { PdfFontFlags } from "./fonts";

type CalendarDayData = {
  isHoliday?: boolean;
  type?: string;
  classWeekday?: number; // 1=Mon ... 7=Sun
  classOrder?: number;
  termId?: string;
  nationalHolidayName?: string;
  isDeleted?: boolean;
};

type CalendarTermData = {
  name?: string;
  termName?: string;
};

function getDb() {
  const existing = getApps()[0];
  const app = existing ? existing : initializeApp();
  return getFirestore(app);
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const toIsoUtc = (d: Date) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

const parseIsoDateUtc = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date format: ${iso}`);
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
};

const addDaysUtc = (base: Date, days: number) =>
  new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + days));

const weekdayToJa = (weekday: number) => {
  switch (weekday) {
    case 1:
      return "月曜";
    case 2:
      return "火曜";
    case 3:
      return "水曜";
    case 4:
      return "木曜";
    case 5:
      return "金曜";
    case 6:
      return "土曜";
    case 7:
      return "日曜";
    default:
      return "";
  }
};

const buildFiscalYearRangeUtc = (fiscalYear: number) => {
  const aprilFirst = new Date(Date.UTC(fiscalYear, 3, 1));
  const startDow = aprilFirst.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceMonday = (startDow + 6) % 7; // Mon=0..Sun=6
  const start = addDaysUtc(aprilFirst, -daysSinceMonday);

  const marchThirtyFirst = new Date(Date.UTC(fiscalYear + 1, 2, 31));
  const endDow = marchThirtyFirst.getUTCDay();
  const toSunday = (7 - endDow) % 7; // 0 if already Sunday
  const end = addDaysUtc(marchThirtyFirst, toSunday);

  return { start, end };
};

const buildIsoDatesUtcInclusive = (startUtc: Date, endUtc: Date) => {
  const dates: string[] = [];
  for (let d = startUtc; d.getTime() <= endUtc.getTime(); d = addDaysUtc(d, 1)) {
    dates.push(toIsoUtc(d));
  }
  return dates;
};

async function fetchCalendarDayMap(params: {
  fiscalYear: string;
  calendarId: string;
  isoDates: string[];
}) {
  const { fiscalYear, calendarId, isoDates } = params;
  const db = getDb();
  const daysCol = db
    .collection(`calendars_${fiscalYear}`)
    .doc(calendarId)
    .collection("calendar_days");

  const monthIds = Array.from(new Set(isoDates.map((iso) => iso.slice(0, 7))));
  const monthSnaps = await db.getAll(...monthIds.map((id) => daysCol.doc(id)));

  const monthDataById = new Map<string, Record<string, unknown>>();
  for (const snap of monthSnaps) {
    if (!snap.exists) continue;
    monthDataById.set(snap.id, snap.data() as Record<string, unknown>);
  }

  const daySnaps = await db.getAll(...isoDates.map((iso) => daysCol.doc(iso)));
  const dayDataByIso = new Map<string, CalendarDayData>();
  for (const snap of daySnaps) {
    if (!snap.exists) continue;
    dayDataByIso.set(snap.id, snap.data() as CalendarDayData);
  }

  const getForIso = (iso: string): CalendarDayData | undefined => {
    const direct = dayDataByIso.get(iso);
    if (direct) return direct.isDeleted ? undefined : direct;

    const monthId = iso.slice(0, 7);
    const monthData = monthDataById.get(monthId);
    const raw = monthData?.[iso];
    if (raw && typeof raw === "object") {
      const record = raw as CalendarDayData;
      return record.isDeleted ? undefined : record;
    }

    return undefined;
  };

  return { getForIso };
}

async function fetchCalendarTermNameById(params: { fiscalYear: string; calendarId: string }) {
  const { fiscalYear, calendarId } = params;
  const db = getDb();
  const snap = await db
    .collection(`calendars_${fiscalYear}`)
    .doc(calendarId)
    .collection("calendar_terms")
    .get();

  const map = new Map<string, string>();
  for (const doc of snap.docs) {
    const data = doc.data() as CalendarTermData;
    const termName = (data.termName ?? data.name ?? "").trim();
    map.set(doc.id, termName);
  }
  return map;
}

async function renderWeekly1Pdf(params: {
  doc: PDFKit.PDFDocument;
  days: A5Weekly1Day[];
  buyerEmail?: string;
  fonts: PdfFontFlags;
}) {
  const { doc, days, buyerEmail, fonts } = params;
  const email = buyerEmail?.trim();

  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("days must be a non-empty array");
  }
  if (days.length % 7 !== 0) {
    throw new Error(`days length must be a multiple of 7, got ${days.length}`);
  }

  return renderPdfToBuffer(doc, () => {
    doc.addPage({ size: a5SizePt(), margin: 0 });
    doc.save();
    doc.fillColor("#6B7280");
    doc.fillOpacity(0.15);
    if (fonts.notoSerifJp) doc.font("jpSerif");
    doc.fontSize(32);
    const watermarkText = email ? email : "Buyer";
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    doc.rotate(-18, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.text(watermarkText, pageWidth * 0.15, pageHeight * 0.35, {
      width: pageWidth * 0.7,
      align: "center",
    });
    doc.restore();

    const fontProbeText = "あいうえおabcABC123漢字";
    if (fonts.notoSansJp) doc.font("jpGothic");
    doc.fillOpacity(1);
    doc.fillColor("#111827");
    doc.fontSize(10);
    doc.text(fontProbeText, mmToPt(10), pageHeight - mmToPt(12), { lineBreak: false });

    let pageNumber = 1;
    for (let offset = 0; offset < days.length; offset += 7) {
      const week = days.slice(offset, offset + 7);
      doc.addPage({ size: a5SizePt(), margin: 0 });
      drawA5Weekly1(doc, { pageNumber, days: week, fonts });
      pageNumber += 1;
    }
  });
}

export async function generateSystemNotebookPdfBuffer(params: {
  doc: PDFKit.PDFDocument;
  fiscalYear: string;
  calendarId: string;
  buyerEmail?: string;
  fonts: PdfFontFlags;
}) {
  const { doc, fiscalYear, calendarId, buyerEmail, fonts } = params;
  if (!/^\d{4}$/.test(fiscalYear) || !calendarId) {
    throw new Error("fiscalYear(YYYY) and calendarId are required");
  }

  const { start, end } = buildFiscalYearRangeUtc(Number(fiscalYear));
  const isoDates = buildIsoDatesUtcInclusive(start, end);
  const termNameById = await fetchCalendarTermNameById({ fiscalYear, calendarId });
  const { getForIso } = await fetchCalendarDayMap({ fiscalYear, calendarId, isoDates });

  const days: A5Weekly1Day[] = isoDates.map((iso) => {
    const record = getForIso(iso);
    const realDow = parseIsoDateUtc(iso).getUTCDay(); // 0=Sun..6=Sat
    const isHoliday = record?.isHoliday === true;

    const classWeekday =
      typeof record?.classWeekday === "number" ? record.classWeekday : undefined;
    const classOrder =
      typeof record?.classOrder === "number" ? record.classOrder : undefined;
    const termId = typeof record?.termId === "string" ? record.termId : undefined;
    const termName = termId ? (termNameById.get(termId) ?? "") : "";

    const descriptionB =
      realDow === 0
        ? termName
        : record?.type === "授業日"
        ? classWeekday && classOrder
          ? `${termName ? `${termName} ` : ""}${weekdayToJa(classWeekday)}授業日 (${classOrder})`
          : termName
        : termName;
    const descriptionA =
      typeof record?.nationalHolidayName === "string" ? record.nationalHolidayName : "";

    return { date: iso, isHoliday, descriptionA, descriptionB };
  });

  return renderWeekly1Pdf({ doc, days, buyerEmail, fonts });
}
