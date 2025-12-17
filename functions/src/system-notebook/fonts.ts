import fs from "fs";
import os from "os";
import path from "path";

import type { Bucket } from "firebase-admin/storage";

type RegisterFontDoc = {
  registerFont: (name: string, src: string) => void;
};

export type PdfFontFlags = {
  playfair: boolean;
  montserrat: boolean;
  notoSansJp: boolean;
  notoSerifJp: boolean;
};

const ensureDir = async (dir: string) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const downloadIfMissing = async (bucket: Bucket, gcsPath: string, localPath: string) => {
  if (fs.existsSync(localPath)) return true;
  await ensureDir(path.dirname(localPath));
  try {
    await bucket.file(gcsPath).download({ destination: localPath });
    return true;
  } catch {
    return false;
  }
};

export async function registerPdfFonts(params: { bucket: Bucket; doc: RegisterFontDoc }) {
  const prefix = (process.env.PDF_FONTS_GCS_PREFIX ?? "resources/fonts").replace(/\/+$/, "");
  const baseDir = path.join(os.tmpdir(), "calendar-refill-fonts");

  const fonts: Array<{ name: keyof PdfFontFlags; alias: string; rel: string }> = [
    {
      name: "playfair",
      alias: "pfMedium",
      rel: "Playfair_Display/PlayfairDisplay-Medium.ttf",
    },
    {
      name: "montserrat",
      alias: "msMedium",
      rel: "Montserrat/Montserrat-Medium.ttf",
    },
    {
      name: "notoSansJp",
      alias: "jpGothic",
      rel: "Noto_Sans_JP/NotoSansJP-Medium.ttf",
    },
    {
      name: "notoSerifJp",
      alias: "jpSerif",
      rel: "Noto_Serif_JP/NotoSerifJP-Medium.ttf",
    },
  ];

  const result: PdfFontFlags = {
    playfair: false,
    montserrat: false,
    notoSansJp: false,
    notoSerifJp: false,
  };

  for (const font of fonts) {
    const gcsPath = `${prefix}/${font.rel}`;
    const localPath = path.join(baseDir, font.rel);
    const ok = await downloadIfMissing(params.bucket, gcsPath, localPath);
    if (!ok) continue;
    params.doc.registerFont(font.alias, localPath);
    result[font.name] = true;
  }

  return result;
}

