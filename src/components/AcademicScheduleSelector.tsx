"use client";

import { useEffect, useMemo, useState } from "react";

export type UniversityOption = {
  id: string;
  name: string;
  furigana?: string;
  code: string;
};

export type CalendarOption = {
  id: string;
  name: string;
  calendarId: string;
  fiscalYear: string;
  universityCode: string;
};

export type SelectedAcademicSchedule = {
  universityName: string;
  universityCode: string;
  calendarName: string;
  calendarId: string;
  fiscalYear: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (value: SelectedAcademicSchedule) => void;
  defaultFiscalYear?: string;
};

const fiscalYearOptions = ["2025", "2026"];

export function AcademicScheduleSelector({
  open,
  onClose,
  onSelect,
  defaultFiscalYear = "2025",
}: Props) {
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [universitiesLoaded, setUniversitiesLoaded] = useState(false);
  const [universityError, setUniversityError] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<UniversityOption | null>(null);
  const [fiscalYear, setFiscalYear] = useState(defaultFiscalYear);
  const [calendars, setCalendars] = useState<CalendarOption[]>([]);
  const [calendarsError, setCalendarsError] = useState<string | null>(null);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false);

  useEffect(() => {
    if (!open || universitiesLoaded) return;

    async function fetchUniversities() {
      try {
        const response = await fetch("/api/universities");

        if (!response.ok) {
          throw new Error("大学一覧の取得に失敗しました");
        }

        const payload = await response.json();
        setUniversities(payload.universities ?? []);
        setUniversitiesLoaded(true);
      } catch (error) {
        console.error(error);
        setUniversityError("大学一覧を取得できませんでした");
      }
    }

    fetchUniversities();
  }, [open, universitiesLoaded]);

  useEffect(() => {
    if (!open || !selectedUniversity) {
      return;
    }

    const universityCode = selectedUniversity.code;

    async function fetchCalendars() {
      setIsLoadingCalendars(true);
      setCalendarsError(null);

      try {
        const response = await fetch(
          `/api/calendars?year=${encodeURIComponent(fiscalYear)}&universityCode=${encodeURIComponent(universityCode)}`,
        );

        if (!response.ok) {
          throw new Error("学事予定の取得に失敗しました");
        }

        const payload = await response.json();
        setCalendars(payload.calendars ?? []);
      } catch (error) {
        console.error(error);
        setCalendarsError("学事予定を取得できませんでした");
      } finally {
        setIsLoadingCalendars(false);
      }
    }

    fetchCalendars();
  }, [fiscalYear, open, selectedUniversity]);

  const filteredUniversities = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase();

    if (!keyword) {
      return universities;
    }

    return universities.filter((university) => {
      const name = university.name.toLowerCase();
      const furigana = university.furigana?.toLowerCase() ?? "";
      return name.includes(keyword) || furigana.includes(keyword);
    });
  }, [searchValue, universities]);

  const handleClose = () => {
    setCalendars([]);
    setSelectedUniversity(null);
    setSearchValue("");
    setCalendarsError(null);
    setFiscalYear(defaultFiscalYear);
    onClose();
  };

  const handleSelectCalendar = (calendar: CalendarOption) => {
    if (!selectedUniversity) return;

    onSelect({
      universityName: selectedUniversity.name,
      universityCode: selectedUniversity.code,
      calendarName: calendar.name,
      calendarId: calendar.calendarId,
      fiscalYear: calendar.fiscalYear,
    });
    handleClose();
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">学事予定を選択</h2>
            <p className="mt-1 text-sm text-gray-600">大学を検索し、年度のカレンダーを選択してください。</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            閉じる
          </button>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.4fr_1fr]">
          <div>
            <label className="text-sm font-medium text-gray-800" htmlFor="university-search">
              大学を検索
            </label>
            <input
              id="university-search"
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="大学名やふりがなを入力"
              className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm shadow-inner focus:border-blue-500 focus:outline-none"
            />

            <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
              {universityError ? (
                <p className="text-sm text-red-600">{universityError}</p>
              ) : filteredUniversities.length === 0 ? (
                <p className="text-sm text-gray-500">該当する大学がありません</p>
              ) : (
                <ul className="divide-y divide-gray-200 text-sm text-gray-800">
                  {filteredUniversities.map((university) => (
                    <li key={university.id}>
                      <button
                        type="button"
                        className={`flex w-full items-center justify-between px-2 py-2 text-left hover:bg-white ${selectedUniversity?.id === university.id ? "bg-white font-medium" : ""}`}
                        onClick={() => {
                          setSelectedUniversity(university);
                        }}
                      >
                        <div>
                          <p className="text-gray-900">{university.name}</p>
                          {university.furigana ? (
                            <p className="text-xs text-gray-500">{university.furigana}</p>
                          ) : null}
                        </div>
                        <span className="text-xs text-gray-500">{university.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-800" htmlFor="fiscal-year">
                年度
              </label>
              <select
                id="fiscal-year"
                className="mt-2 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={fiscalYear}
                onChange={(event) => setFiscalYear(event.target.value)}
              >
                {fiscalYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">学事予定</p>
              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 p-3">
                {!selectedUniversity ? (
                  <p className="text-sm text-gray-500">大学を選択すると学事予定が表示されます</p>
                ) : isLoadingCalendars ? (
                  <p className="text-sm text-gray-500">読み込み中...</p>
                ) : calendarsError ? (
                  <p className="text-sm text-red-600">{calendarsError}</p>
                ) : calendars.length === 0 ? (
                  <p className="text-sm text-gray-500">学事予定がありません</p>
                ) : (
                  <ul className="space-y-2">
                    {calendars.map((calendar) => (
                      <li key={calendar.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectCalendar(calendar)}
                          className="flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-left text-sm shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-blue-50"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{calendar.name}</p>
                            <p className="text-xs text-gray-500">ID: {calendar.calendarId}</p>
                          </div>
                          <span className="text-xs text-gray-500">{calendar.fiscalYear}年度</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
