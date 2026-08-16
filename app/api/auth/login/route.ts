import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { asJsonObject, readJsonBody } from "@/lib/api/session";
import { setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const parsed = await readJsonBody(request);
  if (parsed.error) return parsed.error;
  const record = asJsonObject(parsed.body);
  if (!record) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }
  const email = typeof record.email === "string" ? record.email.trim().toLowerCase() : "";
  const password = typeof record.password === "string" ? record.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await setSessionCookie({ id: user.id, email: user.email, name: user.name });
  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
}
