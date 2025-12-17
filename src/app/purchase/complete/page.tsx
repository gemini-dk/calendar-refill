import { Suspense } from "react";

import PurchaseCompleteClient from "./purchase-complete-client";

export default function PurchaseCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-12">
          <div className="flex w-full max-w-3xl flex-col gap-6 rounded-2xl bg-white p-8 shadow-md">
            <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">購入状況を確認中</p>
              <p className="mt-1 text-sm text-zinc-600">決済情報を読み込んでいます。少々お待ちください。</p>
            </div>
          </div>
        </main>
      }
    >
      <PurchaseCompleteClient />
    </Suspense>
  );
}
