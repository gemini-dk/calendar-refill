"use client";

import { useState } from "react";

import {
  AcademicScheduleSelector,
  SelectedAcademicSchedule,
} from "@/components/AcademicScheduleSelector";

export default function RefillEditPage() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selection, setSelection] = useState<SelectedAcademicSchedule | null>(null);
  const canCreateSystemNotebookPdf = Boolean(selection?.calendarId && selection?.fiscalYear);

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-6">
      <div className="mx-auto max-w-5xl space-y-6 rounded-xl bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">PDF リフィル作成</p>
            <h1 className="text-2xl font-semibold text-gray-900">リフィル編集</h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              disabled={!canCreateSystemNotebookPdf}
              onClick={() => {
                if (!selection) return;
                const url = `/api/system-notebook-pdf?year=${encodeURIComponent(selection.fiscalYear)}&calendarId=${encodeURIComponent(selection.calendarId)}`;
                window.open(url, "_blank");
              }}
              className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition ${
                canCreateSystemNotebookPdf
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "cursor-not-allowed bg-gray-200 text-gray-500"
              }`}
              title={
                canCreateSystemNotebookPdf
                  ? "指定年度の4月分のシステム手帳PDFを作成します"
                  : "学事予定IDを選択すると押下できます"
              }
            >
              システム手帳PDFを作成
            </button>
            <button
              type="button"
              onClick={() => setSelectorOpen(true)}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              学事予定を選択
            </button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          リフィルのテンプレートや大学カレンダーを選択して、最終的なリフィル PDF を作成します。
        </p>

        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
          {selection ? (
            <div className="space-y-3 text-gray-900">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">大学</p>
                  <p className="text-lg font-semibold">{selection.universityName}</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">{selection.universityCode}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-inset ring-gray-200">
                  <p className="text-xs text-gray-500">学事予定</p>
                  <p className="text-base font-medium text-gray-900">{selection.calendarName}</p>
                </div>
                <div className="rounded-md bg-white p-3 shadow-sm ring-1 ring-inset ring-gray-200">
                  <p className="text-xs text-gray-500">年度 / カレンダーID</p>
                  <p className="text-base font-medium text-gray-900">
                    {selection.fiscalYear}年度 / {selection.calendarId}
                  </p>
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setSelectorOpen(true)}
                  className="text-sm font-medium text-blue-700 hover:underline"
                >
                  選択を変更する
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 text-gray-700">
              <p className="text-base font-medium">学事予定がまだ選択されていません。</p>
              <p className="text-sm text-gray-500">
                「学事予定を選択」ボタンから大学と年度を選び、必要なカレンダーをセットしてください。
              </p>
            </div>
          )}
        </div>
      </div>

      <AcademicScheduleSelector
        open={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={(value) => {
          setSelection(value);
          setSelectorOpen(false);
        }}
        defaultFiscalYear="2025"
      />
    </div>
  );
}
