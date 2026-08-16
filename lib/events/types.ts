export const DOMAIN_EVENT_SCHEMA = "route-to-citizenship.event.v1";

export const SERVICE_IDS = ["rule-engine", "documents", "notifications", "analytics", "identity"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export const DOMAIN_EVENT_TYPES = [
  "rules.synced",
  "reminders.requested",
  "documents.processed",
  "analytics.cohort.recorded",
  "account.exported",
  "account.erased",
] as const;
export type DomainEventType = (typeof DOMAIN_EVENT_TYPES)[number];

export interface DomainEvent {
  schema: typeof DOMAIN_EVENT_SCHEMA;
  id: string;
  type: DomainEventType;
  service: ServiceId;
  occurredAt: string;
  /** Never include passport numbers, vault ciphertext, or passwords. */
  payload: Record<string, unknown>;
}

export function createDomainEvent(
  type: DomainEventType,
  service: ServiceId,
  payload: Record<string, unknown>,
  id: string = globalThis.crypto.randomUUID(),
  occurredAt: string = new Date().toISOString(),
): DomainEvent {
  return {
    schema: DOMAIN_EVENT_SCHEMA,
    id,
    type,
    service,
    occurredAt,
    payload,
  };
}
