import { NextResponse } from "next/server";
import { checkOfficialUrls } from "@/lib/url-health";

export async function GET(request: Request) {
  const live = new URL(request.url).searchParams.get("live") === "1";
  const report = await checkOfficialUrls({ live });
  const failed = report.results.filter((item) => !item.ok).length;
  return NextResponse.json({
    ...report,
    summary: {
      total: report.results.length,
      failed,
      live: report.live,
    },
  });
}
