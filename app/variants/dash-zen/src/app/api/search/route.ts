import { NextResponse } from "next/server";
import { getDataStore } from "@/lib/data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const store = getDataStore();
  const results = await store.search(q);
  return NextResponse.json(results);
}
