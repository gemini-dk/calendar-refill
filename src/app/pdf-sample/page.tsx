"use client";

import { useState } from "react";

function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;

  const filenameStarMatch = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(contentDisposition);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1]).replace(/^"+|"+$/g, "");
    } catch {
      return filenameStarMatch[1].replace(/^"+|"+$/g, "");
    }
  }

  const filenameMatch = /filename\s*=\s*("?)([^";]+)\1/i.exec(contentDisposition);
  if (filenameMatch?.[2]) return filenameMatch[2];

  return null;
}

export default function PdfSamplePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerMessage, setTriggerMessage] = useState<string | null>(null);
  const [triggerSessionId, setTriggerSessionId] = useState<string | null>(null);
  const [triggerDownloadUrl, setTriggerDownloadUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sample-pdf", { method: "GET" });
      if (!response.ok) throw new Error("PDFの生成に失敗しました");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const filename =
        extractFilename(response.headers.get("Content-Disposition")) ?? "sample.pdf";
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("PDFを作成してダウンロードしました。");
    } catch (error) {
      console.error(error);
      setMessage("PDFの作成に失敗しました。しばらくしてから再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerFunctions = async () => {
    setIsTriggering(true);
    setTriggerMessage(null);
    setTriggerSessionId(null);
    setTriggerDownloadUrl(null);

    try {
      const triggerRes = await fetch("/api/debug/trigger-stripe-session", { method: "POST" });
      if (!triggerRes.ok) throw new Error("Failed to trigger");
      const triggered = (await triggerRes.json()) as { sessionId?: string; userId?: string };
      const sessionId = triggered.sessionId?.trim();
      const userId = triggered.userId?.trim();
      if (!sessionId || !userId) throw new Error("Invalid trigger response");

      setTriggerSessionId(sessionId);
      setTriggerMessage(
        `Firestore に書き込みました (stripe_sessions/${sessionId})。Functions の処理完了を待っています...`,
      );

      const startedAt = Date.now();
      const timeoutMs = 90_000;

      while (Date.now() - startedAt < timeoutMs) {
        const statusRes = await fetch(
          `/api/debug/stripe-session-status?sessionId=${encodeURIComponent(
            sessionId,
          )}&userId=${encodeURIComponent(userId)}`,
        );
        if (!statusRes.ok) throw new Error("Failed to fetch status");
        const statusJson = (await statusRes.json()) as {
          status?: string | null;
          errorMessage?: string | null;
          downloadUrl?: string | null;
        };

        const status = statusJson.status?.trim();
        const downloadUrl = statusJson.downloadUrl?.trim();

        if (downloadUrl) setTriggerDownloadUrl(downloadUrl);

        if (status === "completed") {
          setTriggerMessage("Functions で PDF 生成が完了しました。");
          return;
        }
        if (status === "failed") {
          setTriggerMessage(
            `Functions の処理に失敗しました: ${statusJson.errorMessage ?? "unknown error"}`,
          );
          return;
        }

        await new Promise((r) => setTimeout(r, 2000));
      }

      setTriggerMessage("タイムアウトしました。もう少し待つか、Firestore の status を確認してください。");
    } catch (error) {
      console.error(error);
      setTriggerMessage("起動に失敗しました（Admin SDK の設定や API を確認してください）。");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">PDF サンプル</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        PDFKit でサーバサイド生成したバイブルサイズのサンプル PDF をダウンロードできます。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          onClick={handleGenerate}
          disabled={isLoading}
        >
          {isLoading ? "生成中..." : "PDFを作成してダウンロード"}
        </button>
        <a
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          href="/"
        >
          ホームへ戻る
        </a>
      </div>
      {message && <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>}

      <div className="rounded-2xl border border-black/10 p-5 dark:border-white/20">
        <h2 className="text-base font-semibold">Firebase Functions の PDF 生成を起動</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          ボタンを押すと Firestore の `stripe_sessions/{`{sessionId}`}` に書き込み、Functions の
          Firestore トリガーを起動します。
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            className="inline-flex h-11 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            onClick={handleTriggerFunctions}
            disabled={isTriggering}
          >
            {isTriggering ? "起動中..." : "Functions を起動"}
          </button>
          {triggerDownloadUrl && (
            <a
              className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 px-5 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
              href={triggerDownloadUrl}
              target="_blank"
              rel="noreferrer"
            >
              生成されたPDFを開く
            </a>
          )}
        </div>
        {triggerSessionId && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            sessionId: {triggerSessionId}
          </p>
        )}
        {triggerMessage && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{triggerMessage}</p>}
      </div>
    </div>
  );
}
