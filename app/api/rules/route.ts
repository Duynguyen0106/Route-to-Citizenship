import { NextResponse } from "next/server";
import { RULES_REVIEWED_ON } from "@/lib/types";
import { ENCODED_RULE_NOTICES, ENCODED_RULE_VERSIONS, noticesForProfile } from "@/lib/rule-versions";
import { listGovukSnapshots, mergeNotices, pageNoticesFromSnapshots } from "@/lib/rule-store";
import { parseProfileInput } from "@/lib/api/profile-input";

export async function GET() {
  const snapshots = await listGovukSnapshots();
  const pageNotices = pageNoticesFromSnapshots(snapshots, RULES_REVIEWED_ON);
  return NextResponse.json({
    lastReviewedOn: RULES_REVIEWED_ON,
    versions: ENCODED_RULE_VERSIONS,
    snapshots,
    notices: mergeNotices(ENCODED_RULE_NOTICES, pageNotices, ["*"]),
    source: "govuk-content-api",
  });
}

export async function POST(request: Request) {
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const profile = parseProfileInput(body);
  const snapshots = await listGovukSnapshots();
  const pageNotices = pageNoticesFromSnapshots(snapshots, RULES_REVIEWED_ON);
  const encoded = profile
    ? noticesForProfile(profile)
    : ENCODED_RULE_NOTICES;
  const keys = profile ? [profile.pathwayId] : ["*"];
  return NextResponse.json({
    lastReviewedOn: RULES_REVIEWED_ON,
    versions: ENCODED_RULE_VERSIONS,
    snapshots,
    notices: mergeNotices(encoded, pageNotices, keys),
  });
}
