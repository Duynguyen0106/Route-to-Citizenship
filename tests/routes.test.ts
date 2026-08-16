import { describe, expect, it } from "vitest";
import {
  ROUTES,
  effectiveMinYearsToILR,
  getRouteByKey,
  getRouteForPathway,
  getRoutesForVisaType,
  isSwitchingAllowed,
  listFeaturedRoutes,
  listRoutes,
  switchingTargets,
  visaIdToCurrentVisaType,
} from "../lib/routes";

describe("core route rule engine", () => {
  it("defines the five featured routes plus additional UK categories", () => {
    expect(listFeaturedRoutes()).toHaveLength(5);
    expect(listRoutes().length).toBeGreaterThan(5);
    expect(listRoutes().map((route) => route.key)).toEqual(
      expect.arrayContaining([
        "skilled-worker",
        "family",
        "student-graduate-skilled-worker",
        "global-talent",
        "long-residence",
        "innovator-founder",
        "global-business-mobility",
        "youth-mobility",
        "dependant",
        "child-registration",
      ]),
    );
    expect(ROUTES.skilledWorker).toMatchObject({
      key: "skilled-worker",
      name: "Skilled Worker to ILR to Citizenship",
      visaTypes: ["SKILLED_WORKER"],
      visaTypesInvolved: ["SKILLED_WORKER"],
      minYearsToILR: 5,
      ilrRequiresContinuousResidence: true,
      absenceLimit: 180,
      absenceLimitPerYear: 180,
      englishRequirement: "B1",
      lifeInUKRequired: true,
      switchingAllowed: true,
      lastReviewedOn: "2026-08-01",
    });
    expect(ROUTES.skilledWorker.officialUrls.map((link) => link.url)).toEqual(
      expect.arrayContaining([
        "https://www.gov.uk/skilled-worker-visa",
        "https://www.gov.uk/indefinite-leave-to-remain",
        "https://www.gov.uk/british-citizenship",
      ]),
    );
    expect(ROUTES.family.minYearsToILR).toBe(5);
    expect(ROUTES.studentToGraduateToSkilled.visaTypes).toEqual([
      "STUDENT",
      "GRADUATE",
      "SKILLED_WORKER",
    ]);
    expect(ROUTES.globalTalent.minYearsToILR).toBe(3);
    expect(ROUTES.longResidence.minYearsToILR).toBe(10);
  });

  it("looks up routes by key and pathway", () => {
    expect(getRouteByKey("family").name).toContain("Family visa");
    expect(getRouteForPathway("student-to-skilled").key).toBe(
      ROUTES.studentToGraduateToSkilled.key,
    );
    expect(getRoutesForVisaType("GRADUATE").map((route) => route.key)).toContain(
      "student-graduate-skilled-worker",
    );
  });

  it("does not start the study-path ILR clock until Skilled Worker", () => {
    const route = ROUTES.studentToGraduateToSkilled;
    expect(effectiveMinYearsToILR(route, "STUDENT")).toBeNull();
    expect(effectiveMinYearsToILR(route, "GRADUATE")).toBeNull();
    expect(effectiveMinYearsToILR(route, "SKILLED_WORKER")).toBe(5);
    expect(effectiveMinYearsToILR(route, "GRADUATE", { plannedSwitch: true })).toBe(5);
  });

  it("uses 10 years on the family 10-year partner route", () => {
    expect(
      effectiveMinYearsToILR(ROUTES.family, "FAMILY", { currentVisaId: "spouse-10" }),
    ).toBe(10);
  });

  it("uses 5 years for Global Talent exceptional promise and 3 years otherwise", () => {
    expect(
      effectiveMinYearsToILR(ROUTES.globalTalent, "GLOBAL_TALENT", {
        currentVisaId: "global-talent-promise",
      }),
    ).toBe(5);
    expect(effectiveMinYearsToILR(ROUTES.globalTalent, "GLOBAL_TALENT")).toBe(3);
  });

  it("does not start an ILR clock when the current visa is outside the route", () => {
    expect(effectiveMinYearsToILR(ROUTES.skilledWorker, "OTHER")).toBeNull();
    expect(effectiveMinYearsToILR(ROUTES.family, "STUDENT")).toBeNull();
  });

  it("maps catalogue visa ids onto current-visa types", () => {
    expect(visaIdToCurrentVisaType("skilled-worker")).toBe("SKILLED_WORKER");
    expect(visaIdToCurrentVisaType("spouse-10")).toBe("FAMILY");
    expect(visaIdToCurrentVisaType("visitor")).toBe("VISITOR");
    expect(visaIdToCurrentVisaType("innovator-founder")).toBe("INNOVATOR_FOUNDER");
    expect(visaIdToCurrentVisaType("gbm")).toBe("GBM");
  });

  it("treats switching as allowed between settlement-leading routes", () => {
    expect(isSwitchingAllowed(ROUTES.skilledWorker, ROUTES.globalTalent)).toBe(true);
    expect(isSwitchingAllowed(ROUTES.skilledWorker, ROUTES.skilledWorker)).toBe(false);
    expect(switchingTargets(ROUTES.family).length).toBeGreaterThan(4);
    expect(switchingTargets(ROUTES.family).some((route) => route.key === ROUTES.family.key)).toBe(
      false,
    );
  });
});
