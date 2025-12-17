import PDFDocument from "pdfkit";
import { type A5Weekly1Day, drawA5Weekly1 } from "@/lib/templates/a5Weekly1";
import { a5SizePt, renderPdfToBuffer } from "@/lib/pdfutils";

export const runtime = "nodejs";

type Weekly1PdfRequest = {
  days: A5Weekly1Day[]; // Monday-start, full period
  startPageNumber?: number; // default 1
  includeRightPage?: boolean; // default true
};

const buildSampleDays = (): A5Weekly1Day[] => {
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const toIso = (d: Date) =>
    `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;

  const days: A5Weekly1Day[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(2025, 3, 7 + i));
    days.push({
      date: toIso(d),
      isHoliday: false,
      descriptionA: i === 3 ? "勤労感謝の日" : "",
      descriptionB:
        i === 0
          ? "春休み"
          : i === 1
            ? "春休み"
            : i === 2
              ? "前期 水曜授業 (1)"
              : i === 3
                ? "前期 木曜授業 (1)"
                : i === 4
                  ? "前期 金曜授業 (1)"
                  : i === 5
                    ? "前期 土曜授業 (1)"
                    : "前期 日曜",
    });
  }
  return days;
};

const renderWeekly1Pdf = async (request: Weekly1PdfRequest) => {
  const includeRightPage = request.includeRightPage ?? true;
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

      if (includeRightPage) {
        doc.addPage({ size: a5SizePt(), margin: 0 });
        drawA5Weekly1(doc, { pageNumber, days: week });
        pageNumber += 1;
      }
    }
  });

  return pdf;
};

export async function GET() {
  const pdf = await renderWeekly1Pdf({
    days: buildSampleDays(),
    startPageNumber: 1,
    includeRightPage: true,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="a5-weekly1-sample-2pages.pdf"',
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json()) as Weekly1PdfRequest;
  const pdf = await renderWeekly1Pdf(body);

  const first = body.days?.[0]?.date ?? "weekly1";
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="a5-weekly1-${first}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
