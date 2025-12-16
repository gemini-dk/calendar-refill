export default function PdfSamplePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">PDF サンプル</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        PDFKit でサーバサイド生成したバイブルサイズのサンプル PDF をダウンロードできます。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          href="/api/sample-pdf"
        >
          サンプルPDFをダウンロード
        </a>
        <a
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          href="/"
        >
          ホームへ戻る
        </a>
      </div>
    </div>
  );
}

