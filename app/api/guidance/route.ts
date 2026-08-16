import { NextResponse } from "next/server";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { answerGuidance } from "@/lib/guidance-bot";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  if (!body) return badRequest("Request body must be a JSON object.");
  const message = typeof body.message === "string" ? body.message : "";
  if (message.length > 500) return badRequest("Keep questions under 500 characters.");
  return NextResponse.json(answerGuidance(message));
}
