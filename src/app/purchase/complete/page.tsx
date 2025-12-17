"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StripeDocument = {
  status?: string;
  downloadUrl?: {
    url?: string;
  };
};

const generatingStatuses = new Set([
  "paid_processing",
  "generating_pdf",
  "processing",
  "queued",
]);

function StatusIndicator({ label, description }: { label: string; description: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-zinc-900">{label}</p>
      <p className="mt-1 text-sm text-zinc-600">{description}</p>
    </div>
  );
}

export default function PurchaseCompletePage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const [status, setStatus] = useState<string>("loading");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel = useMemo(() => {
    if (status === "failed") {
      return "決済に失敗しました";
    }

    if (downloadUrl) {
      return "生成が完了しました";
    }

    if (generatingStatuses.has(status)) {
      return "ファイルを生成中です";
    }

    return "ステータスを確認しています";
  }, [downloadUrl, status]);

  const statusDescription = useMemo(() => {
    if (status === "failed") {
      return "決済が失敗したか、処理中に問題が発生しました。再度お試しいただくかサポートまでご連絡ください。";
    }

    if (downloadUrl) {
      return "購入完了メールを送信しました。引き続き下のボタンからダウンロードもできます。";
    }

    if (generatingStatuses.has(status)) {
      return "お支払いが確認できました。ファイル生成が完了するまでこのままお待ちください。";
    }

    return "決済内容を確認しています。少し時間を置いてからもう一度お試しください。";
  }, [downloadUrl, status]);

  useEffect(() => {
    if (!sessionId) return undefined;

    let isCancelled = false;
    let pollHandle: ReturnType<typeof setInterval> | null = null;

    const poll = async () => {
      if (isCancelled) return;

      try {
        const response = await fetch(
          `/api/purchase-status?session_id=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as StripeDocument & { error?: string };

        if (!response.ok) {
          throw new Error(data?.error ?? "購入状況を取得できませんでした");
        }

        if (isCancelled) return;
        setStatus(data?.status ?? "loading");
        setDownloadUrl(data?.downloadUrl?.url ?? null);

        if (data?.status === "failed" || data?.downloadUrl?.url) {
          if (pollHandle) clearInterval(pollHandle);
          pollHandle = null;
        }
      } catch (pollError) {
        if (isCancelled) return;
        setError(
          pollError instanceof Error
            ? pollError.message
            : "購入状況の取得に失敗しました。しばらくしてから再度お試しください。",
        );
      }
    };

    void poll();
    pollHandle = setInterval(poll, 2500);

    return () => {
      isCancelled = true;
      if (pollHandle) clearInterval(pollHandle);
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
        <div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-md">
          <h1 className="text-xl font-semibold text-zinc-900">セッション情報が見つかりません</h1>
          <p className="mt-3 text-sm text-zinc-600">
            決済が正しく完了していない可能性があります。トップページからやり直してください。
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
              href="/"
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
      <div className="flex w-full max-w-3xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Purchase Complete</p>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-900">購入手続きが完了しました</h1>
            <p className="mt-2 text-sm text-zinc-600">
              セッション ID: <span className="font-mono">{sessionId}</span>
            </p>
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">決済完了</div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            エラーが発生しました: {error}
          </div>
        )}

        <StatusIndicator label={statusLabel} description={statusDescription} />

        {downloadUrl && (
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold text-emerald-900">ダウンロードの準備ができました</p>
              <p className="text-sm text-emerald-800">入力いただいたメールアドレスへも送信済みです。</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                ダウンロードする
              </a>
              <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700">
                メール送信済み
              </span>
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">再試行のご案内</p>
            <p className="mt-1 text-sm text-amber-800">
              決済が完了しなかった場合は、以下より再度お手続きいただくかサポートまでお問い合わせください。
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                href="/refill-edit"
              >
                もう一度決済する
              </Link>
              <a
                className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-900 transition hover:border-amber-400"
                href="mailto:support@example.com"
              >
                サポートに連絡する
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
