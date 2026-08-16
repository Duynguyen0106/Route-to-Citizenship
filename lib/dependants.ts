import { addYears, parseISO } from "date-fns";
import { citizenshipEligibleDate, toIsoDate } from "./settlement";
import type {
  CitizenshipPath,
  Dependant,
  DependantPlan,
  Profile,
} from "./types";

function laterIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a >= b ? a : b;
}

export function childCitizenshipPath(options: {
  bornInUk: boolean;
  britishParent: boolean;
  parentIlrOn: string | null;
  alreadyHasIlr: boolean;
}): { path: CitizenshipPath; date: string | null; summary: string } {
  const { bornInUk, britishParent, parentIlrOn, alreadyHasIlr } = options;
  if (bornInUk && (britishParent || alreadyHasIlr)) {
    return {
      path: "already_british",
      date: null,
      summary:
        "A child born in the UK is usually British automatically if a parent was British or settled at the time of birth. Confirm the facts at birth — this is not a registration estimate.",
    };
  }
  if (bornInUk && parentIlrOn) {
    return {
      path: "registration_birth",
      date: parentIlrOn,
      summary:
        "A child born in the UK whose parent later becomes settled can usually register as British (British Nationality Act 1981, section 1(3)) from that ILR date. This is registration, not naturalisation.",
    };
  }
  if (britishParent) {
    return {
      path: "registration_parent",
      date: toIsoDate(new Date()),
      summary:
        "A child under 18 with a British parent may be able to register as British (often section 3(1), which is discretionary). The planner uses today as a placeholder — an adviser should check the exact section.",
    };
  }
  return {
    path: "naturalisation",
    date: null,
    summary:
      "No child-registration route is modelled from the details entered. ILR then naturalisation may still apply later.",
  };
}

export function planForDependant(
  dependant: Dependant,
  mainIlrOn: string | null,
  asOf: Date,
  mainAlreadyHasIlr: boolean,
): DependantPlan {
  const grant = dependant.visaGrantedOn || "";
  const fiveYearsAfterGrant = grant ? toIsoDate(addYears(parseISO(grant), 5)) : null;
  const ilrEligibleOn =
    dependant.kind === "child" && dependant.ageBand === "under_18"
      ? mainIlrOn
      : laterIso(mainIlrOn, fiveYearsAfterGrant);

  if (dependant.kind === "child") {
    const registration = childCitizenshipPath({
      bornInUk: dependant.bornInUk,
      britishParent: dependant.britishParent,
      parentIlrOn: mainIlrOn,
      alreadyHasIlr: mainAlreadyHasIlr,
    });
    return {
      id: dependant.id,
      kind: "child",
      label: dependant.bornInUk ? "Child born in the UK" : "Child dependant",
      ilrEligibleOn: registration.path === "already_british" ? null : ilrEligibleOn,
      citizenshipEligibleOn: registration.date,
      citizenshipPath: registration.path,
      summary: registration.summary,
    };
  }

  const residenceStart = parseISO(dependant.ukEntryDate || dependant.visaGrantedOn || toIsoDate(asOf));
  const ilrDate = ilrEligibleOn ? parseISO(ilrEligibleOn) : null;
  const citizenshipOn = citizenshipEligibleDate({
    ilrEligibleOn: ilrDate,
    ilrGrantedOn: null,
    residenceStart,
    marriedToBritishCitizen: false,
    alreadyHasIlr: false,
  });

  return {
    id: dependant.id,
    kind: "partner",
    label: "Partner dependant",
    ilrEligibleOn,
    citizenshipEligibleOn: citizenshipOn ? toIsoDate(citizenshipOn) : null,
    citizenshipPath: "naturalisation",
    summary:
      "A partner granted as a dependant of a settlement-leading visa typically applies for ILR after 5 years, often when the main applicant does. Naturalisation then usually needs ILR first.",
  };
}

export function planDependants(
  profile: Profile,
  mainIlrOn: string | null,
  asOf: Date,
  mainAlreadyHasIlr: boolean,
): DependantPlan[] {
  const listed = profile.dependants ?? [];
  if (listed.length) {
    return listed.map((dependant) => planForDependant(dependant, mainIlrOn, asOf, mainAlreadyHasIlr));
  }

  const count = Math.max(0, profile.dependantCount ?? 0);
  if (count === 0) return [];

  const synthetic: DependantPlan[] = [];
  for (let index = 0; index < count; index += 1) {
    synthetic.push(
      planForDependant(
        {
          id: `dependant-${index + 1}`,
          kind: index === 0 && count === 1 ? "partner" : index === 0 ? "partner" : "child",
          ageBand: index === 0 ? "18_to_64" : "under_18",
          bornInUk: false,
          britishParent: profile.marriedToBritishCitizen,
          visaGrantedOn: profile.visaGrantedOn,
          visaExpiresOn: profile.visaExpiresOn,
          ukEntryDate: profile.ukEntryDate,
        },
        mainIlrOn,
        asOf,
        mainAlreadyHasIlr,
      ),
    );
  }
  return synthetic;
}

export function mainCitizenshipPath(options: {
  profile: Profile;
  asOf: Date;
  ilrOn: Date | null;
  alreadyHasIlr: boolean;
}): { kind: CitizenshipPath; eligibleOn: string | null; detail: string } {
  const { profile, ilrOn, alreadyHasIlr } = options;
  const parentIlrOn =
    profile.mainApplicantIlrOn || (alreadyHasIlr ? profile.visaGrantedOn : ilrOn ? toIsoDate(ilrOn) : null);

  if (profile.ageBand === "under_18" || profile.currentVisaId === "child-registration") {
    const registration = childCitizenshipPath({
      bornInUk: profile.bornInUk,
      britishParent: profile.hasBritishParent,
      parentIlrOn,
      alreadyHasIlr,
    });
    if (registration.path !== "naturalisation") {
      return {
        kind: registration.path,
        eligibleOn: registration.date,
        detail: registration.summary,
      };
    }
  }

  const residenceStart = parseISO(profile.ukEntryDate || profile.qualifyingResidenceStart);
  const citizenshipOn = citizenshipEligibleDate({
    ilrEligibleOn: alreadyHasIlr ? parseISO(profile.visaGrantedOn) : ilrOn,
    ilrGrantedOn: alreadyHasIlr ? parseISO(profile.visaGrantedOn) : null,
    residenceStart,
    marriedToBritishCitizen: profile.marriedToBritishCitizen,
    alreadyHasIlr,
  });

  if (!citizenshipOn) {
    return {
      kind: "none",
      eligibleOn: null,
      detail: "Citizenship cannot be estimated until there is an ILR date, or a child-registration path.",
    };
  }

  if (profile.marriedToBritishCitizen) {
    return {
      kind: "naturalisation_spouse",
      eligibleOn: toIsoDate(citizenshipOn),
      detail:
        "After ILR, spouses of British citizens can usually naturalise after 3 years’ residence. ILR must come first — there is no extra 12-month wait after settlement.",
    };
  }

  return {
    kind: "naturalisation",
    eligibleOn: toIsoDate(citizenshipOn),
    detail: "Usually 12 months after ILR, and at least 5 years’ residence.",
  };
}
