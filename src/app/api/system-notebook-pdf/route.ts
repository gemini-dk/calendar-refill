import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/firebase-admin";
import { a5SizePt, renderPdfToBuffer } from "@/lib/pdfutils";
import { type A5Weekly1Day, drawA5Weekly1 } from "@/lib/templates/a5Weekly1";

export const runtime = "nodejs";

type CalendarDayData = {
  isHoliday?: boolean;
  classWeekday?: number; // 1=Mon ... 7=Sun
  classOrder?: number;
  nationalHolidayName?: string;
  isDeleted?: boolean;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toIsoUtc = (d: Date) =>
  `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

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

const buildAprilRangeUtc = (fiscalYear: number) => {
  const aprilFirst = new Date(Date.UTC(fiscalYear, 3, 1));
  const dow = aprilFirst.getUTCDay(); // 0=Sun..6=Sat
  const sinceMonday = (dow + 6) % 7; // Mon=0..Sun=6
  const start = addDaysUtc(aprilFirst, -(sinceMonday === 0 ? 7 : sinceMonday));

  const april31 = new Date(Date.UTC(fiscalYear, 4, 1)); // 4/31 == 5/1
  const endDow = april31.getUTCDay();
  const toSunday = (7 - endDow) % 7; // 0 if already Sunday
  const end = addDaysUtc(april31, toSunday);

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

const renderWeekly1Pdf = async (request: {
  days: A5Weekly1Day[];
  startPageNumber?: number;
}) => {
  const startPageNumber = request.startPageNumber ?? 1;
  const days = request.days;

  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("days must be a non-empty array");
  }
  if (days.length % 7 !== 0) {
    throw new Error(`days length must be a multiple of 7, got ${days.length}`);
  }

  const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
  const pdf = await renderPdfToBuffer(doc, () => {
    let pageNumber = startPageNumber;
    for (let offset = 0; offset < days.length; offset += 7) {
      const week = days.slice(offset, offset + 7);

      doc.addPage({ size: a5SizePt(), margin: 0 });
      drawA5Weekly1(doc, { pageNumber, days: week });
      pageNumber += 1;
    }
  });

  return pdf;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fiscalYear = searchParams.get("year")?.trim();
  const calendarId = searchParams.get("calendarId")?.trim();

  if (!fiscalYear || !/^\d{4}$/.test(fiscalYear) || !calendarId) {
    return NextResponse.json(
      { error: "year(YYYY) and calendarId are required" },
      { status: 400 },
    );
  }

  const { start, end } = buildAprilRangeUtc(Number(fiscalYear));
  const isoDates = buildIsoDatesUtcInclusive(start, end);
  const { getForIso } = await fetchCalendarDayMap({ fiscalYear, calendarId, isoDates });

  const days: A5Weekly1Day[] = isoDates.map((iso) => {
    const record = getForIso(iso);
    const isHoliday = record?.isHoliday === true;

    const classWeekday =
      typeof record?.classWeekday === "number" ? record.classWeekday : undefined;
    const classOrder =
      typeof record?.classOrder === "number" ? record.classOrder : undefined;

    const descriptionB =
      classWeekday && classOrder
        ? `${weekdayToJa(classWeekday)}授業日 (${classOrder})`
        : "";
    const descriptionA =
      typeof record?.nationalHolidayName === "string" ? record.nationalHolidayName : "";

    return { date: iso, isHoliday, descriptionA, descriptionB };
  });

  const pdf = await renderWeekly1Pdf({ days, startPageNumber: 1 });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="system-notebook-${fiscalYear}-04-${calendarId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
