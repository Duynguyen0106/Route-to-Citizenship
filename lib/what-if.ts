import { addDays, parseISO } from "date-fns";
import { analyseAbsences } from "./absences";
import { calculatePlan } from "./calculate";
import { toIsoDate } from "./dates";
import type { AbsenceTrip, PlanResult, Profile } from "./types";

export interface WhatIfAbsenceInput {
  departedOn: string;
  days: number;
}

export interface WhatIfAbsenceResult {
  extraTrip: AbsenceTrip;
  baseline: PlanResult;
  projected: PlanResult;
  flags: string[];
  last12Delta: number;
  breachedAfter: boolean;
}

export function extraAbsenceTrip(input: WhatIfAbsenceInput): AbsenceTrip {
  const start = parseISO(input.departedOn);
  const days = Math.max(1, Math.round(input.days));
  const returnedOn = Number.isNaN(start.getTime())
    ? input.departedOn
    : toIsoDate(addDays(start, days));
  return {
    id: "what-if-trip",
    departedOn: input.departedOn,
    returnedOn,
    place: "What-if scenario",
  };
}

export function simulateWhatIfAbsence(
  profile: Profile,
  input: WhatIfAbsenceInput,
  asOf: Date = new Date(),
): WhatIfAbsenceResult {
  const extraTrip = extraAbsenceTrip(input);
  const baseline = calculatePlan(profile, asOf);
  const projected = calculatePlan(
    {
      ...profile,
      absences: [...(profile.absences ?? []).filter((trip) => trip.id !== extraTrip.id), extraTrip],
    },
    asOf,
  );

  const start = parseISO(profile.qualifyingResidenceStart || profile.ukEntryDate || profile.visaGrantedOn);
  const tripEnd = parseISO(extraTrip.returnedOn);
  const analysisAsOf =
    !Number.isNaN(tripEnd.getTime()) && tripEnd.getTime() > asOf.getTime() ? tripEnd : asOf;
  const tripsWithoutWhatIf = (profile.absences ?? []).filter((trip) => trip.id !== extraTrip.id);
  const baselineAbsences = analyseAbsences(tripsWithoutWhatIf, analysisAsOf, start);
  const projectedAbsences = analyseAbsences([...tripsWithoutWhatIf, extraTrip], analysisAsOf, start);

  const flags: string[] = [];
  if (!projectedAbsences.breached180 && baselineAbsences.breached180) {
    flags.push("This extra trip does not change an existing 180-day breach.");
  }
  if (projectedAbsences.breached180 && !baselineAbsences.breached180) {
    flags.push(
      "This trip would take you over 180 days outside the UK in a 12-month period. That can break continuous residence for ILR.",
    );
  } else if (projectedAbsences.last12Months > 150 && !projectedAbsences.breached180) {
    flags.push(
      `You would have ${projectedAbsences.last12Months} days outside the UK in the last 12 months — close to the usual 180-day ILR limit.`,
    );
  }
  if (projectedAbsences.last12Months > 90 && baselineAbsences.last12Months <= 90) {
    flags.push(
      "The last-12-months citizenship limit is usually 90 days. This trip would exceed that window (citizenship can still be possible later if the window moves).",
    );
  }
  if (projectedAbsences.last5Years > 450 && baselineAbsences.last5Years <= 450) {
    flags.push("This trip would push 5-year absences over the usual 450-day citizenship limit.");
  }
  if (projected.ilrEligibleOn === baseline.ilrEligibleOn && projectedAbsences.breached180) {
    flags.push(
      "The sketched ILR date is unchanged because the clock is calendar-based. A 180-day breach can still refuse the application even if the date looks the same.",
    );
  }
  if (flags.length === 0) {
    flags.push(
      "On the dates entered, this extra trip stays inside the usual ILR 180-day and citizenship absence sketches. Confirm the Home Office calculation before you travel.",
    );
  }

  return {
    extraTrip,
    baseline,
    projected,
    flags,
    last12Delta: projectedAbsences.last12Months - baselineAbsences.last12Months,
    breachedAfter: projectedAbsences.breached180,
  };
}
