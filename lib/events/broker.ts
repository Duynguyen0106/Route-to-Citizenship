import { emit } from "./bus";
import type { DomainEvent, DomainEventType, ServiceId } from "./types";

/**
 * Kafka / SQS stay off. This prototype does not need a broker: one process can
 * fan out rule syncs, reminder requests and analytics opt-ins in memory.
 * Connecting a broker would not change the vault (on-device) or legal limits.
 */
export const EVENT_BROKER_LIVE = false;

export const EVENT_BROKER_REASON =
  "Events stay in this process. Kafka and AWS SQS are not connected. This planner will not report a broker delivery that did not happen.";

export type EventTransport = "memory" | "sqs" | "kafka";

export function configuredEventTransport(): EventTransport {
  if (EVENT_BROKER_LIVE && process.env.EVENT_BUS_TRANSPORT === "sqs") return "sqs";
  if (EVENT_BROKER_LIVE && process.env.EVENT_BUS_TRANSPORT === "kafka") return "kafka";
  return "memory";
}

export async function dispatch(
  type: DomainEventType,
  service: ServiceId,
  payload: Record<string, unknown>,
): Promise<{
  event: DomainEvent;
  published: boolean;
  transport: EventTransport;
  reason: string | null;
}> {
  const event = emit(type, service, payload);
  const transport = configuredEventTransport();
  if (transport !== "memory") {
    return { event, published: false, transport, reason: EVENT_BROKER_REASON };
  }
  return {
    event,
    published: true,
    transport: "memory",
    reason: EVENT_BROKER_LIVE ? null : EVENT_BROKER_REASON,
  };
}

export async function publishToSqs(event: DomainEvent): Promise<{ published: false; reason: string }> {
  return { published: false, reason: `${EVENT_BROKER_REASON} (${event.type})` };
}

export async function publishToKafka(event: DomainEvent): Promise<{ published: false; reason: string }> {
  return { published: false, reason: `${EVENT_BROKER_REASON} (${event.type})` };
}
