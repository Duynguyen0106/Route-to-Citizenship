import { parseISO } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculatePlan } from "@/lib/calculate";
import {
  daysAway,
  englishStatusToLevel,
  pathwayToRouteKey,
  plannerStateFromProfile,
  reminderKindToType,
  relationshipToSettled,
  visaIdToCurrentVisaType,
  dbProfileToPlanner,
} from "@/lib/db/mappers";
import type { Profile } from "@/lib/types";

const profileInclude = {
  visaEvents: { orderBy: { startDate: "asc" as const } },
  absenceRecords: { orderBy: { startDate: "asc" as const } },
  routeSelections: true,
};

export async function getPlannerProfileForUser(userId: string): Promise<Profile | null> {
  const row = await prisma.profile.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: profileInclude,
  });
  if (!row) return null;
  return dbProfileToPlanner(row);
}

export async function savePlannerProfile(userId: string, profile: Profile): Promise<Profile> {
  const existing = await prisma.profile.findFirst({ where: { userId } });
  const visaStart = parseISO(profile.visaGrantedOn);
  const visaExpiry = parseISO(profile.visaExpiresOn);
  const firstEntry = profile.ukEntryDate ? parseISO(profile.ukEntryDate) : null;
  const plannerState = plannerStateFromProfile(profile);
  const routeKey = pathwayToRouteKey(profile.pathwayId);

  const data = {
    nationality: profile.nationality,
    currentVisaType: visaIdToCurrentVisaType(profile.currentVisaId),
    visaStartDate: visaStart,
    visaExpiryDate: visaExpiry,
    firstEntryUK: firstEntry,
    relationshipToSettled: relationshipToSettled(profile),
    englishLevel: englishStatusToLevel(profile.englishStatus),
    lifeInUKPassed: profile.lifeInUkStatus === "passed",
    plannerState: plannerState as unknown as Prisma.InputJsonValue,
  };

  const saved = await prisma.$transaction(async (tx) => {
    const row = existing
      ? await tx.profile.update({ where: { id: existing.id }, data })
      : await tx.profile.create({ data: { ...data, userId } });

    await tx.visaEvent.deleteMany({ where: { profileId: row.id } });
    await tx.absenceRecord.deleteMany({ where: { profileId: row.id } });
    await tx.routeSelection.deleteMany({ where: { profileId: row.id } });

    const visaEvents = [
      ...profile.priorStages
        .filter((stage) => stage.start)
        .map((stage) => ({
          userId,
          profileId: row.id,
          visaType: stage.visaId,
          startDate: parseISO(stage.start),
          endDate: stage.end ? parseISO(stage.end) : null,
          notes: "history",
        })),
      {
        userId,
        profileId: row.id,
        visaType: profile.currentVisaId,
        startDate: visaStart,
        endDate: visaExpiry,
        notes: "current",
      },
    ];

    if (profile.plannedSwitchOn) {
      visaEvents.push({
        userId,
        profileId: row.id,
        visaType: profile.plannedSwitchTo || "skilled-worker",
        startDate: parseISO(profile.plannedSwitchOn),
        endDate: null,
        notes: "planned-switch",
      });
    }

    if (visaEvents.length) {
      await tx.visaEvent.createMany({ data: visaEvents });
    }

    const absences = profile.absences.filter((trip) => trip.departedOn && trip.returnedOn);
    if (absences.length) {
      await tx.absenceRecord.createMany({
        data: absences.map((trip) => ({
          profileId: row.id,
          startDate: parseISO(trip.departedOn),
          endDate: parseISO(trip.returnedOn),
          daysAway: daysAway(trip.departedOn, trip.returnedOn),
          reason: trip.place || null,
        })),
      });
    }

    await tx.routeSelection.create({
      data: {
        profileId: row.id,
        routeKey,
        isCurrent: true,
      },
    });

    const plan = calculatePlan({ ...profile, id: row.id });
    const completed = await tx.reminder.findMany({
      where: { userId, profileId: row.id, isCompleted: true },
      select: { type: true, dueDate: true },
    });
    const completedKeys = new Set(
      completed.map((item) => `${item.type}:${item.dueDate.toISOString().slice(0, 10)}`),
    );

    await tx.reminder.deleteMany({ where: { userId, profileId: row.id } });

    if (plan.reminders.length) {
      await tx.reminder.createMany({
        data: plan.reminders.map((reminder) => {
          const type = reminderKindToType(reminder.kind);
          return {
            userId,
            profileId: row.id,
            title: reminder.title,
            dueDate: parseISO(reminder.date),
            type,
            isCompleted: completedKeys.has(`${type}:${reminder.date}`),
          };
        }),
      });
    }

    return tx.profile.findUniqueOrThrow({
      where: { id: row.id },
      include: profileInclude,
    });
  });

  return dbProfileToPlanner(saved);
}

export async function deletePlannerProfile(userId: string): Promise<void> {
  await prisma.profile.deleteMany({ where: { userId } });
  await prisma.reminder.deleteMany({ where: { userId } });
}
