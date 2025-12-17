import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

type CalendarRecord = {
  id: string;
  name: string;
  calendarId: string;
  fiscalYear: string;
  universityCode: string;
  isPublishable?: boolean;
  order?: number;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fiscalYear = searchParams.get("year");
  const universityCode = searchParams.get("universityCode");

  if (!fiscalYear || !universityCode) {
    return NextResponse.json(
      { error: "year and universityCode are required" },
      { status: 400 },
    );
  }

  const collectionName = `calendars_${fiscalYear}`;

  try {
    const snapshot = await getDb()
      .collection(collectionName)
      .where("universityCode", "==", universityCode)
      .get();

    const calendars: CalendarRecord[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: data.name ?? "",
          calendarId: data.calendarId ?? doc.id,
          fiscalYear: data.fiscalYear ?? fiscalYear,
          universityCode: data.universityCode ?? universityCode,
          isPublishable: data.isPublishable,
          order: data.order,
        };
      })
      .filter((calendar) => calendar.name && calendar.isPublishable !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(({ isPublishable, order, ...rest }) => rest);

    return NextResponse.json({ calendars });
  } catch (error) {
    console.error("Failed to fetch calendars", error);
    return NextResponse.json(
      { error: "Failed to fetch calendars" },
      { status: 500 },
    );
  }
}
