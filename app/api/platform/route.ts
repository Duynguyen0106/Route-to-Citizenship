import { NextResponse } from "next/server";
import { platformStatus } from "@/lib/services/manifest";

export async function GET() {
  return NextResponse.json(platformStatus());
}
