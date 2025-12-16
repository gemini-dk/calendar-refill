import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { PassThrough } from "stream";

export const runtime = "nodejs";

const mmToPt = (mm: number) => (mm * 72) / 25.4;

export async function GET() {
  // "バイブルサイズ" (システム手帳) の代表的な寸法: 95mm × 170mm
  const pageWidth = mmToPt(95);
  const pageHeight = mmToPt(170);

  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margin: 0,
    autoFirstPage: true,
  });

  // 日本語を表示するには日本語グリフを含むフォントの埋め込みが必要
  const fontsDir = path.join(process.cwd(), "resources", "fonts");
  const pickFirstExisting = (candidates: string[]) =>
    candidates.find((filePath) => fs.existsSync(filePath));

  const serifFontPath = pickFirstExisting([
    path.join(fontsDir, "NotoSerifJP-VariableFont_wght.ttf"),
    path.join(fontsDir, "NotoSerifJP-Regular.ttf"),
  ]);

  const playfairRegularPath = pickFirstExisting([
    path.join(fontsDir, "PlayfairDisplay-VariableFont_wght.ttf"),
  ]);
  const playfairItalicPath = pickFirstExisting([
    path.join(fontsDir, "PlayfairDisplay-Italic-VariableFont_wght.ttf"),
  ]);

  const montserratRegularPath = pickFirstExisting([
    path.join(fontsDir, "Montserrat-VariableFont_wght.ttf"),
  ]);
  const montserratItalicPath = pickFirstExisting([
    path.join(fontsDir, "Montserrat-Italic-VariableFont_wght.ttf"),
  ]);

  const gothicFontPath =
    pickFirstExisting([
      path.join(fontsDir, "NotoSansJP-VariableFont_wght.ttf"),
      path.join(fontsDir, "NotoSansJP-Regular.ttf"),
    ]) ??
    (() => {
      try {
        const entries = fs.readdirSync(fontsDir, { withFileTypes: true });
        const fontFiles = entries
          .filter((e) => e.isFile())
          .map((e) => e.name)
          .filter((name) => /\.(ttf|otf|ttc)$/i.test(name));
        const sansLike = fontFiles.find((name) => /sans|gothic/i.test(name));
        const otherThanSerif = fontFiles.find(
          (name) => !serifFontPath || path.join(fontsDir, name) !== serifFontPath,
        );
        const chosen = sansLike ?? otherThanSerif;
        return chosen ? path.join(fontsDir, chosen) : undefined;
      } catch {
        return undefined;
      }
    })();

  if (serifFontPath) doc.registerFont("jpSerif", serifFontPath);
  if (gothicFontPath) doc.registerFont("jpGothic", gothicFontPath);
  if (playfairRegularPath) doc.registerFont("pfRegular", playfairRegularPath);
  if (playfairItalicPath) doc.registerFont("pfItalic", playfairItalicPath);
  if (montserratRegularPath) doc.registerFont("msRegular", montserratRegularPath);
  if (montserratItalicPath) doc.registerFont("msItalic", montserratItalicPath);

  const stream = new PassThrough();
  const chunks: Buffer[] = [];

  stream.on("data", (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  });

  const done = new Promise<Buffer>((resolve, reject) => {
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
    doc.on("error", reject);
  });

  doc.pipe(stream);

  const margin = mmToPt(8);
  const left = margin;
  const top = margin;
  const width = pageWidth - margin * 2;
  const height = pageHeight - margin * 2;

  doc.save();
  doc.lineWidth(0.6).strokeColor("#000000");
  doc.rect(left, top, width, height).stroke();

  // 四角い罫線（グリッド）
  const cell = mmToPt(5);
  doc.lineWidth(0.3);

  for (let x = left + cell; x < left + width; x += cell) {
    doc.moveTo(x, top).lineTo(x, top + height).stroke();
  }
  for (let y = top + cell; y < top + height; y += cell) {
    doc.moveTo(left, y).lineTo(left + width, y).stroke();
  }
  doc.restore();

  // テキスト
  doc.fillColor("#000000").fontSize(18);
  doc.save();
  // フォントファイルのウェイト切替ができない場合は、塗り+ストロークで擬似的に太らせる
  doc.strokeColor("#000000").lineWidth(0.4);
  const boldText = (text: string, x: number, y: number) =>
    doc.text(text, x, y, { lineBreak: false, fill: true, stroke: true });

  if (serifFontPath) doc.font("jpSerif");
  boldText("明朝: あいうえお", left + cell, top + cell);

  const secondLineY = top + cell + doc.currentLineHeight(true) + mmToPt(3);
  if (gothicFontPath) doc.font("jpGothic");
  boldText("ゴシック: あいうえお", left + cell, secondLineY);

  const enText = "1/31 Sun,Mon,Tue,Wed,Thr,Fri,Sat";
  const thirdLineY = secondLineY + doc.currentLineHeight(true) + mmToPt(4);
  if (playfairRegularPath) doc.font("pfRegular");
  doc.fontSize(16);
  boldText(enText, left + cell, thirdLineY);

  const fourthLineY = thirdLineY + doc.currentLineHeight(true) + mmToPt(3);
  if (playfairItalicPath) doc.font("pfItalic");
  doc.fontSize(16);
  boldText(enText, left + cell, fourthLineY);

  const fifthLineY = fourthLineY + doc.currentLineHeight(true) + mmToPt(4);
  if (montserratRegularPath) doc.font("msRegular");
  doc.fontSize(16);
  boldText(enText, left + cell, fifthLineY);

  const sixthLineY = fifthLineY + doc.currentLineHeight(true) + mmToPt(3);
  if (montserratItalicPath) doc.font("msItalic");
  doc.fontSize(16);
  boldText(enText, left + cell, sixthLineY);

  doc.restore();

  doc.end();
  const pdf = await done;

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="bible-sample.pdf"',
      "Cache-Control": "no-store",
    },
  });
}
