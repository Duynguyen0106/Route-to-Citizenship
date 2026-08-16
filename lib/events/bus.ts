import { createDomainEvent, type DomainEvent, type DomainEventType, type ServiceId } from "./types";

type Handler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Map<DomainEventType | "*", Handler[]>();
const outbox: DomainEvent[] = [];
const MAX_OUTBOX = 200;

export function subscribe(type: DomainEventType | "*", handler: Handler): () => void {
  const list = handlers.get(type) ?? [];
  list.push(handler);
  handlers.set(type, list);
  return () => {
    const next = (handlers.get(type) ?? []).filter((item) => item !== handler);
    handlers.set(type, next);
  };
}

export function publish(event: DomainEvent): { delivered: number } {
  outbox.push(event);
  if (outbox.length > MAX_OUTBOX) outbox.splice(0, outbox.length - MAX_OUTBOX);
  const list = [...(handlers.get(event.type) ?? []), ...(handlers.get("*") ?? [])];
  for (const handler of list) {
    try {
      void handler(event);
    } catch {
      /* handlers must not break the request */
    }
  }
  return { delivered: list.length };
}

export function emit(
  type: DomainEventType,
  service: ServiceId,
  payload: Record<string, unknown>,
): DomainEvent {
  const event = createDomainEvent(type, service, payload);
  publish(event);
  return event;
}

export function listOutbox(): DomainEvent[] {
  return [...outbox];
}

export function resetEventBus(): void {
  handlers.clear();
  outbox.length = 0;
}
