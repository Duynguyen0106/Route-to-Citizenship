import { GDPR_EXPORT_SCHEMA, GDPR_RIGHTS, PROCESSING_INVENTORY } from "./gdpr";
import { buildSharePack, sharePackJson } from "./share-pack";
import type { PlanResult, Profile } from "./types";

export { GDPR_EXPORT_SCHEMA };

export const ACCOUNT_EXPORT_SCHEMA = "route-to-citizenship.account.v1";
export const GUEST_EXPORT_SCHEMA = "route-to-citizenship.guest.v1";
export const ACCOUNT_DELETE_PHRASE = "DELETE";

export function accountDeleteError(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Type DELETE to confirm. This cannot be undone.";
  }
  if ((body as Record<string, unknown>).confirm !== ACCOUNT_DELETE_PHRASE) {
    return "Type DELETE to confirm. This cannot be undone.";
  }
  return null;
}

export interface AccountExport {
  schema: typeof ACCOUNT_EXPORT_SCHEMA;
  exportedOn: string;
  account: {
    email: string;
    name: string | null;
    plan: string;
  };
  share: ReturnType<typeof buildSharePack>;
}

export function buildAccountExport(input: {
  email: string;
  name: string | null;
  plan: string;
  profile: Profile;
  planResult: PlanResult;
}): AccountExport {
  return {
    schema: ACCOUNT_EXPORT_SCHEMA,
    exportedOn: new Date().toISOString(),
    account: {
      email: input.email,
      name: input.name,
      plan: input.plan,
    },
    share: buildSharePack(input.profile, input.planResult),
  };
}

export function accountExportJson(pack: AccountExport | GdprExport): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export interface GdprExport {
  schema: typeof GDPR_EXPORT_SCHEMA;
  exportedOn: string;
  rights: typeof GDPR_RIGHTS;
  processing: typeof PROCESSING_INVENTORY;
  account: {
    email: string;
    name: string | null;
    plan: string;
    createdAt: string;
  };
  plan: AccountExport | null;
  organisations: {
    name: string;
    workers: { label: string; visaType: string; visaExpiresOn: string }[];
  }[];
  enquiries: { id: string; kind: string; message: string; createdAt: string }[];
  shareLinks: { id: string; label: string; expiresAt: string; revokedAt: string | null }[];
  vault: { location: "device"; uploaded: false; note: string };
}

export function buildGdprExport(input: {
  email: string;
  name: string | null;
  plan: string;
  createdAt: string;
  profile: Profile | null;
  planResult: PlanResult | null;
  organisations: GdprExport["organisations"];
  enquiries: GdprExport["enquiries"];
  shareLinks: GdprExport["shareLinks"];
}): GdprExport {
  return {
    schema: GDPR_EXPORT_SCHEMA,
    exportedOn: new Date().toISOString(),
    rights: GDPR_RIGHTS,
    processing: PROCESSING_INVENTORY,
    account: {
      email: input.email,
      name: input.name,
      plan: input.plan,
      createdAt: input.createdAt,
    },
    plan:
      input.profile && input.planResult
        ? buildAccountExport({
            email: input.email,
            name: input.name,
            plan: input.plan,
            profile: input.profile,
            planResult: input.planResult,
          })
        : null,
    organisations: input.organisations,
    enquiries: input.enquiries,
    shareLinks: input.shareLinks,
    vault: {
      location: "device",
      uploaded: false,
      note: "Encrypted document copies stay in this browser and are not included in this file.",
    },
  };
}

export { sharePackJson };
