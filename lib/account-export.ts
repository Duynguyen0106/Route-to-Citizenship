import { buildSharePack, sharePackJson } from "./share-pack";
import type { PlanResult, Profile } from "./types";

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

export function accountExportJson(pack: AccountExport): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export { sharePackJson };
