import { currentVisaTypeToDefaultVisaId } from "@/lib/db/mappers";
import { normalizeProfile } from "@/lib/storage";
import type { Profile } from "@/lib/types";

export function parseProfileInput(body: unknown, existing?: Profile | null): Profile | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const nested = record.profile;
  const raw = (
    nested && typeof nested === "object" ? { ...existing, ...nested } : { ...existing, ...record }
  ) as Partial<Profile> & { currentVisaType?: string };

  const currentVisaId =
    raw.currentVisaId ||
    (raw.currentVisaType ? currentVisaTypeToDefaultVisaId(raw.currentVisaType) : existing?.currentVisaId);

  if (!currentVisaId) return null;
  return normalizeProfile({ ...raw, currentVisaId });
}

export function profileIsComplete(profile: Profile): boolean {
  return Boolean(profile.currentVisaId && profile.visaGrantedOn && profile.visaExpiresOn);
}
