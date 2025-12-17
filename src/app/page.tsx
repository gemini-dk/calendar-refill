"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  DocumentData,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";

type University = {
  id: string;
  name: string;
  furigana: string;
  code?: string;
};

type AcademicSchedule = {
  id: string;
  name: string;
  fiscalYear: number;
  universityCode?: string;
};

const normalize = (value: string) => value.trim().toLowerCase();

export default function AcademicScheduleFinderPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [universityQuery, setUniversityQuery] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(
    null,
  );
  const [fiscalYear, setFiscalYear] = useState<string>("");
  const [schedules, setSchedules] = useState<AcademicSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [universityLoadError, setUniversityLoadError] = useState<string | null>(
    null,
  );
  const [scheduleLoadError, setScheduleLoadError] = useState<string | null>(
    null,
  );
  const [isLoadingUniversities, setIsLoadingUniversities] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  useEffect(() => {
    const fetchUniversities = async () => {
      setIsLoadingUniversities(true);
      setUniversityLoadError(null);
      try {
        const snapshot = await getDocs(collection(firestore, "university"));
        const fetched = snapshot.docs.map((doc) => {
          const data = doc.data() as DocumentData;
          return {
            id: doc.id,
            name: data.name as string,
            furigana: data.furigana as string,
            code: (data.code as string | undefined) ?? (data.universityCode as string | undefined),
          } satisfies University;
        });
        setUniversities(fetched);
      } catch (error) {
        setUniversityLoadError(
          "大学一覧の取得に失敗しました。Firebase の接続情報を確認してください。",
        );
      } finally {
        setIsLoadingUniversities(false);
      }
    };

    fetchUniversities();
  }, []);

  const filteredUniversities = useMemo(() => {
    if (!universityQuery) {
      return universities;
    }
    const normalized = normalize(universityQuery);
    return universities.filter((university) =>
      [university.name, university.furigana]
        .map(normalize)
        .some((value) => value.includes(normalized)),
    );
  }, [universityQuery, universities]);

  const handleSelectUniversity = (university: University) => {
    setSelectedUniversity(university);
    setSchedules([]);
    setSelectedScheduleId(null);
  };

  const fetchSchedules = useCallback(async () => {
    if (!selectedUniversity) {
      setScheduleLoadError("大学を選択してください。");
      return;
    }

    const parsedYear = Number(fiscalYear);
    if (!fiscalYear || Number.isNaN(parsedYear)) {
      setScheduleLoadError("年度は数値で入力してください。");
      return;
    }

    setIsLoadingSchedules(true);
    setScheduleLoadError(null);
    try {
      const scheduleQuery = query(
        collection(firestore, "calendars"),
        where("universityCode", "==", selectedUniversity.code ?? selectedUniversity.id),
        where("fiscalYear", "==", parsedYear),
      );
      const snapshot = await getDocs(scheduleQuery);
      const fetchedSchedules = snapshot.docs.map((doc) => {
        const data = doc.data() as DocumentData;
        return {
          id: doc.id,
          name: (data.name as string) ?? "名称未設定",
          fiscalYear: data.fiscalYear as number,
          universityCode: data.universityCode as string | undefined,
        } satisfies AcademicSchedule;
      });
      setSchedules(fetchedSchedules);
      setSelectedScheduleId(null);
      if (fetchedSchedules.length === 0) {
        setScheduleLoadError("該当する学事予定が見つかりませんでした。");
      }
    } catch (error) {
      setScheduleLoadError(
        "学事予定の取得に失敗しました。Firestore の権限とクエリ設定を確認してください。",
      );
    } finally {
      setIsLoadingSchedules(false);
    }
  }, [fiscalYear, selectedUniversity]);

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-6 py-12 font-sans text-zinc-900">
      <main className="w-full max-w-5xl rounded-2xl bg-white p-10 shadow-lg">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold text-indigo-600">Firestore リファレンス検索</p>
          <h1 className="text-3xl font-bold text-zinc-900">
            学事予定 ID を特定する
          </h1>
          <p className="text-sm text-zinc-600">
            docs/schema.md で定義された university マスタと calendar サマリーを元に、
            文字列一致の検索で大学を特定し、年度に紐づく学事予定 ID を選択します。
          </p>
        </div>

        <section className="mb-8 space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-600">Step 1</p>
              <h2 className="text-xl font-semibold text-zinc-900">大学を検索する</h2>
            </div>
            {isLoadingUniversities && <span className="text-xs text-zinc-500">読み込み中...</span>}
          </div>
          <label className="block text-sm font-medium text-zinc-700">
            大学名・ふりがな
            <input
              type="text"
              value={universityQuery}
              onChange={(event) => setUniversityQuery(event.target.value)}
              placeholder="例: 東京大学 / とうきょうだいがく"
              className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none"
            />
          </label>
          {universityLoadError ? (
            <p className="text-sm text-red-600">{universityLoadError}</p>
          ) : (
            <div className="grid max-h-72 grid-cols-1 gap-3 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-3 md:grid-cols-2">
              {filteredUniversities.map((university) => (
                <button
                  key={university.id}
                  type="button"
                  onClick={() => handleSelectUniversity(university)}
                  className={`flex w-full flex-col items-start rounded-lg border px-4 py-3 text-left transition hover:border-indigo-400 hover:bg-indigo-50 ${selectedUniversity?.id === university.id ? "border-indigo-500 bg-indigo-50" : "border-zinc-200"}`}
                >
                  <span className="text-sm font-semibold text-zinc-900">{university.name}</span>
                  <span className="text-xs text-zinc-500">{university.furigana}</span>
                  {university.code && (
                    <span className="mt-1 text-[11px] text-zinc-500">コード: {university.code}</span>
                  )}
                </button>
              ))}
              {!filteredUniversities.length && !universityLoadError && (
                <p className="col-span-2 text-center text-sm text-zinc-500">
                  一致する大学がありません。検索キーワードを確認してください。
                </p>
              )}
            </div>
          )}
          {selectedUniversity && (
            <p className="text-sm text-indigo-700">
              選択中: {selectedUniversity.name} ({selectedUniversity.furigana})
            </p>
          )}
        </section>

        <section className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-indigo-600">Step 2</p>
              <h2 className="text-xl font-semibold text-zinc-900">年度で学事予定を絞り込む</h2>
            </div>
            {isLoadingSchedules && <span className="text-xs text-zinc-500">読み込み中...</span>}
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="md:flex-1">
              <span className="text-sm font-medium text-zinc-700">年度</span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="2000"
                max="2100"
                value={fiscalYear}
                onChange={(event) => setFiscalYear(event.target.value)}
                placeholder="例: 2025"
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm shadow-inner focus:border-indigo-500 focus:outline-none"
              />
            </label>
            <button
              type="button"
              onClick={fetchSchedules}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={isLoadingSchedules}
            >
              学事予定を取得
            </button>
          </div>
          {scheduleLoadError && (
            <p className="text-sm text-red-600">{scheduleLoadError}</p>
          )}
          <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
            {schedules.map((schedule) => (
              <label
                key={schedule.id}
                className={`flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 transition ${selectedScheduleId === schedule.id ? "border-indigo-500 bg-indigo-50" : "border-zinc-200 hover:border-indigo-400 hover:bg-indigo-50"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-zinc-900">{schedule.name}</p>
                    <p className="text-xs text-zinc-600">年度: {schedule.fiscalYear}</p>
                    {schedule.universityCode && (
                      <p className="text-[11px] text-zinc-500">大学コード: {schedule.universityCode}</p>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="academicSchedule"
                    className="h-4 w-4 text-indigo-600"
                    checked={selectedScheduleId === schedule.id}
                    onChange={() => setSelectedScheduleId(schedule.id)}
                  />
                </div>
                <p className="text-[11px] text-indigo-700">学事予定 ID: {schedule.id}</p>
              </label>
            ))}
            {!schedules.length && !scheduleLoadError && (
              <p className="text-sm text-zinc-500">
                大学と年度を指定して学事予定を検索してください。
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
