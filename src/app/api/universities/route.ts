import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

type UniversityRecord = {
  id: string;
  name: string;
  furigana?: string;
  code: string;
};

export async function GET() {
  try {
    const snapshot = await getDb()
      .collection("universities")
      .orderBy("name")
      .get();

    const universities: UniversityRecord[] = snapshot.docs
      .map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          name: data.name ?? "",
          furigana: data.furigana ?? "",
          code: data.code ?? "",
        };
      })
      .filter((university) => university.name && university.code);

    return NextResponse.json({ universities });
  } catch (error) {
    console.error("Failed to fetch universities", error);
    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 },
    );
  }
}
