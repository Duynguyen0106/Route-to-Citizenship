import type { Metadata } from "next";
import Link from "next/link";
import { GDPR_RIGHTS, PROCESSING_INVENTORY } from "@/lib/gdpr";
import { LEGAL_NOTICE } from "@/lib/legal";
import { OBJECT_STORAGE_LIVE, OBJECT_STORAGE_REASON } from "@/lib/object-storage";
import { EVENT_BROKER_LIVE, EVENT_BROKER_REASON } from "@/lib/events/broker";
import { SERVICES } from "@/lib/services/manifest";

export const metadata: Metadata = { title: "Security and architecture" };

export default function SecurityPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Trust</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Security, privacy and architecture</h1>
      <p className="mt-6 text-[17px] leading-relaxed text-ink-muted">{LEGAL_NOTICE}</p>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">ISO/IEC 27001</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink">
          This product is <strong>not ISO 27001 certified</strong>. Certification is an organisational
          audit of people, suppliers and operations — it cannot be claimed from application code.
          Technical controls here (encryption, headers, minimisation, export and erasure) are the
          pieces a future certification would inspect.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">On-device processing</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink">
          Route dates, absences, fees and document scans run in this browser. Encrypted vault files
          never leave the device. {OBJECT_STORAGE_LIVE ? "Object storage is on." : OBJECT_STORAGE_REASON}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">Four services, one app</h2>
        <p className="mt-3 text-[17px] leading-relaxed text-ink">
          Rule engine, documents, notifications and analytics are separate libraries with typed
          events. They are not network microservices. Kafka and AWS SQS are not connected
          {EVENT_BROKER_LIVE ? "." : ` — ${EVENT_BROKER_REASON}`}
        </p>
        <ul className="mt-4 space-y-3">
          {SERVICES.map((service) => (
            <li key={service.id} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3">
              <p className="font-medium text-navy">{service.title}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">{service.location}</p>
              <p className="mt-2 text-sm text-ink-muted">{service.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-serif text-2xl text-navy">GDPR</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-[17px] leading-relaxed text-ink">
          {GDPR_RIGHTS.map((right) => (
            <li key={right.id}>
              <strong>{right.title}.</strong> {right.how}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          <Link href="/account" className="text-navy underline">
            Account export and deletion
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="text-navy underline">
            Privacy notice
          </Link>
        </p>
        <h3 className="mt-8 font-serif text-xl text-navy">What is processed</h3>
        <ul className="mt-4 space-y-3">
          {PROCESSING_INVENTORY.map((row) => (
            <li key={row.id} className="rounded-xl border border-navy/10 bg-paper-50 px-4 py-3 text-sm">
              <p className="font-medium text-navy">{row.category}</p>
              <p className="mt-1 text-ink-muted">{row.purpose}</p>
              <p className="mt-1 text-xs text-ink-faint">
                {row.location} · {row.retained}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
