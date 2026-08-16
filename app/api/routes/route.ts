import { NextResponse } from "next/server";
import { serializeRoute } from "@/lib/api/calculate-response";
import { listRoutes } from "@/lib/routes";

export async function GET() {
  return NextResponse.json({
    routes: listRoutes().map(serializeRoute),
  });
}
