import path from "path";
import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getDb, getStorageBucket } from "@/lib/firebase-admin";
import { a5SizePt, registerFontIfExists, renderPdfToBuffer } from "@/lib/pdfutils";
import { type A5Weekly1Day, drawA5Weekly1 } from "@/lib/templates/a5Weekly1";

export const runtime = "nodejs";

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

const renderWeekly1Pdf = async (request: {
  days: A5Weekly1Day[];
  startPageNumber?: number;
  buyerName?: string;
  buyerEmail?: string;
}) => {
  const startPageNumber = request.startPageNumber ?? 1;
  const days = request.days;
  const buyerName = request.buyerName?.trim();
  const buyerEmail = request.buyerEmail?.trim();

  if (!Array.isArray(days) || days.length === 0) {
    throw new Error("days must be a non-empty array");
  }
  if (days.length % 7 !== 0) {
    throw new Error(`days length must be a multiple of 7, got ${days.length}`);
  }

  const doc = new PDFDocument({ autoFirstPage: false, margin: 0 });
  const pdf = await renderPdfToBuffer(doc, () => {
    const fontsDir = path.join(process.cwd(), "resources", "fonts");
    const notoSerifMedium = path.join(fontsDir, "Noto_Serif_JP", "NotoSerifJP-Medium.ttf");
    const hasSerif = registerFontIfExists(doc, "jpSerif", notoSerifMedium);

    doc.addPage({ size: a5SizePt(), margin: 0 });
    doc.save();
    doc.fillColor("#6B7280");
    doc.fillOpacity(0.15);
    if (hasSerif) doc.font("jpSerif");
    doc.fontSize(32);
    const lines = [buyerName, buyerEmail].filter(Boolean);
    const watermarkText = lines.length > 0 ? lines.join("\n") : "Buyer";
    const [pageWidth, pageHeight] = a5SizePt();
    doc.rotate(-18, { origin: [pageWidth / 2, pageHeight / 2] });
    doc.text(watermarkText, pageWidth * 0.15, pageHeight * 0.35, {
      width: pageWidth * 0.7,
      align: "center",
    });
    doc.restore();

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
  const userId = searchParams.get("userId")?.trim();
  const buyerName = searchParams.get("buyerName")?.trim();
  const buyerEmail = searchParams.get("buyerEmail")?.trim();

  if (!fiscalYear || !/^\d{4}$/.test(fiscalYear) || !calendarId) {
    return NextResponse.json(
      { error: "year(YYYY) and calendarId are required" },
      { status: 400 },
    );
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

  const pdf = await renderWeekly1Pdf({
    days,
    startPageNumber: 1,
    buyerName,
    buyerEmail,
  });

  if (userId) {
    try {
      const bucket = getStorageBucket();
      const db = getDb();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      const filePath = `system-notebook/${userId}/${fiscalYear}-${calendarId}-${Date.now()}.pdf`;
      const file = bucket.file(filePath);

      await file.save(pdf, {
        contentType: "application/pdf",
        resumable: false,
        metadata: {
          metadata: {
            calendarId,
            fiscalYear,
            userId,
          },
        },
      });

      const [downloadUrl] = await file.getSignedUrl({
        action: "read",
        expires: expiresAt,
      });

      await db
        .collection("stripe")
        .doc(userId)
        .set(
          {
            downloadUrl: {
              url: downloadUrl,
              expiresAt: Timestamp.fromDate(expiresAt),
              path: filePath,
            },
            downloadUrlUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    } catch (error) {
      console.error("Failed to save PDF", error);
      return NextResponse.json({ error: "Failed to save PDF" }, { status: 500 });
    }
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="system-notebook-${fiscalYear}-${calendarId}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
