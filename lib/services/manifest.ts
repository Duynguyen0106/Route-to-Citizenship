import { EVENT_BROKER_LIVE, EVENT_BROKER_REASON } from "../events/broker";
import { OBJECT_STORAGE_LIVE, OBJECT_STORAGE_REASON } from "../object-storage";

export const SERVICES = [
  {
    id: "rule-engine",
    title: "Rule engine",
    location: "on-device",
    detail:
      "ILR, citizenship, absences and fees run as a pure function in this browser (the same function as /api/calculate). Results are not stored unless you save a plan.",
  },
  {
    id: "documents",
    title: "Document processing",
    location: "on-device",
    detail:
      "OCR-from-paste, AES-GCM encryption and completeness checks stay on this device. Ciphertext is never uploaded to S3 or /api.",
  },
  {
    id: "notifications",
    title: "Notifications",
    location: "in-process",
    detail:
      "Reminders are .ics, mailto, or browser alerts. GOV.UK Notify is used only when API keys are set (public-sector deployments).",
  },
  {
    id: "analytics",
    title: "Analytics",
    location: "in-process",
    detail:
      "Opt-in anonymous sketches (visa category, coarse nationality region, sketched dates). Groups smaller than 5 are hidden. No name or email.",
  },
] as const;

export function platformStatus() {
  return {
    architecture: "modular-monolith",
    microservices: false,
    reason:
      "Four bounded contexts exist as libraries in one Next.js app. Splitting them into network services is not required at this scale and would not move vault files off the device.",
    services: SERVICES,
    events: {
      bus: "in-process",
      brokerLive: EVENT_BROKER_LIVE,
      brokerReason: EVENT_BROKER_REASON,
    },
    objectStorage: {
      live: OBJECT_STORAGE_LIVE,
      reason: OBJECT_STORAGE_REASON,
    },
    iso27001: {
      certified: false,
      note: "ISO/IEC 27001 is an organisational certification. This app implements technical controls (encryption, headers, minimisation, erasure) but is not certified.",
    },
  };
}
