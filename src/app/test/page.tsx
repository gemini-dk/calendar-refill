"use client";

import { useState } from "react";

export default function TestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/test-pdf");
      if (!response.ok) {
        throw new Error("PDFの生成に失敗しました");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "weekly-planner.pdf";
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDFをダウンロードしました。");
    } catch (error) {
      console.error(error);
      setMessage("PDFの作成に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm font-semibold text-emerald-600">/test</p>
          <h1 className="text-4xl font-bold leading-tight">システム手帳 PDF テンプレート</h1>
          <p className="max-w-3xl text-lg text-slate-600">
            ボタンを押すと、サーバーサイドでPDFを生成しダウンロードできます。左右見開きで4分割された週次ページを手帳風に描画しています。
          </p>
        </header>

        <section className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">PDFをダウンロード</h2>
              <p className="text-slate-600">今週の月曜始まりで日付を配置し、左右のページに穴あけ位置も描画します。</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              disabled={isLoading}
            >
              {isLoading ? "生成中..." : "PDFを作成"}
            </button>
          </div>
          {message && <p className="mt-4 text-sm text-slate-700">{message}</p>}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {["左ページ", "右ページ"].map((title, index) => (
            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Preview</span>
              </div>
              <div className="mt-4 space-y-3">
                {[...Array(4)].map((_, cellIndex) => (
                  <div
                    key={`${index}-${cellIndex}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full border-2 border-slate-200 bg-white"></div>
                      <div className="space-y-1">
                        <div className="h-3 w-24 rounded-full bg-slate-200"></div>
                        <div className="h-3 w-32 rounded-full bg-slate-100"></div>
                      </div>
                    </div>
                    <div className="h-3 w-12 rounded-full bg-emerald-200"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
