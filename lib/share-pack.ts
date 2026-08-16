import { LEGAL_NOTICE } from "./legal";
import { RULES_REVIEWED_ON } from "./types";
import type { ChecklistItem, PlanResult, Profile } from "./types";
import type { VaultItemMeta } from "./document-completeness";

export const SHARE_SCHEMA = "route-to-citizenship.share.v1";

export interface SharePack {
  schema: typeof SHARE_SCHEMA;
  generatedOn: string;
  disclaimer: string;
  rulesReviewedOn: string;
  profile: {
    pathwayId: string;
    currentVisaId: string;
    nationality: string;
    visaGrantedOn: string;
    visaExpiresOn: string;
    qualifyingResidenceStart: string;
    ukEntryDate: string;
    englishStatus: string;
    lifeInUkStatus: string;
    marriedToBritishCitizen: boolean;
    dependantCount: number;
    applyFromInsideUk: boolean;
    absences: Profile["absences"];
    checkedDocumentIds: string[];
    englishTest: Profile["englishTest"];
    lifeInUkBooking: Profile["lifeInUkBooking"];
  };
  plan: {
    asOf: string;
    summary: string;
    ilrEligibleOn: string | null;
    ilrApplyFrom: string | null;
    citizenshipEligibleOn: string | null;
    citizenshipPath: string;
    last12MonthsAway: number;
    feesTotalGbp: number;
  };
  checklist: { id: string; label: string; required: boolean; checked: boolean }[];
  vaultMeta: { kind: string; label: string; expiresOn: string | null; last4: string | null }[];
}

const PASSPORTISH = /\bpassport\b/i;
const LONG_NUMBER = /\b\d{8,9}\b/;

export function packContainsIdentityNumbers(text: string): boolean {
  return PASSPORTISH.test(text) && LONG_NUMBER.test(text);
}

export function buildSharePack(
  profile: Profile,
  plan: PlanResult,
  vaultMeta: Pick<VaultItemMeta, "kind" | "label" | "expiresOn" | "last4">[] = [],
): SharePack {
  return {
    schema: SHARE_SCHEMA,
    generatedOn: new Date().toISOString(),
    disclaimer: LEGAL_NOTICE,
    rulesReviewedOn: RULES_REVIEWED_ON,
    profile: {
      pathwayId: profile.pathwayId,
      currentVisaId: profile.currentVisaId,
      nationality: profile.nationality,
      visaGrantedOn: profile.visaGrantedOn,
      visaExpiresOn: profile.visaExpiresOn,
      qualifyingResidenceStart: profile.qualifyingResidenceStart,
      ukEntryDate: profile.ukEntryDate,
      englishStatus: profile.englishStatus,
      lifeInUkStatus: profile.lifeInUkStatus,
      marriedToBritishCitizen: profile.marriedToBritishCitizen,
      dependantCount: profile.dependantCount,
      applyFromInsideUk: profile.applyFromInsideUk,
      absences: profile.absences.map((trip) => ({
        id: trip.id,
        departedOn: trip.departedOn,
        returnedOn: trip.returnedOn,
        place: trip.place,
      })),
      checkedDocumentIds: profile.checkedDocumentIds,
      englishTest: profile.englishTest
        ? { ...profile.englishTest, last4: profile.englishTest.last4 ? profile.englishTest.last4.slice(-4) : null }
        : null,
      lifeInUkBooking: profile.lifeInUkBooking,
    },
    plan: {
      asOf: plan.asOf,
      summary: plan.summary,
      ilrEligibleOn: plan.ilrEligibleOn,
      ilrApplyFrom: plan.ilrApplyFrom,
      citizenshipEligibleOn: plan.citizenshipEligibleOn,
      citizenshipPath: plan.citizenshipPath,
      last12MonthsAway: plan.absences.last12Months,
      feesTotalGbp: plan.fees.totalGbp,
    },
    checklist: plan.checklist.map((item: ChecklistItem) => ({
      id: item.id,
      label: item.label,
      required: item.required,
      checked: profile.checkedDocumentIds.includes(item.id),
    })),
    vaultMeta: vaultMeta.map((item) => ({
      kind: item.kind,
      label: item.label,
      expiresOn: item.expiresOn,
      last4: item.last4,
    })),
  };
}

export function sharePackJson(pack: SharePack): string {
  return `${JSON.stringify(pack, null, 2)}\n`;
}

export function isSharePack(value: unknown): value is SharePack {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as { schema?: unknown };
  return record.schema === SHARE_SCHEMA;
}
