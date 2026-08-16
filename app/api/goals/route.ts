import { NextResponse } from "next/server";
import { asJsonObject, badRequest, readJsonBody } from "@/lib/api/session";
import { interpretGoal } from "@/lib/goal-nlp";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = asJsonObject(parsed.body);
  if (!body) return badRequest("Request body must be a JSON object.");
  const text = typeof body.text === "string" ? body.text : "";
  if (text.length > 400) return badRequest("Keep the goal under 400 characters.");
  return NextResponse.json({ matches: interpretGoal(text), notLegalAdvice: true });
}
