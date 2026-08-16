import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bell,
  CalendarRange,
  ClipboardCheck,
  GitCompare,
  Plane,
  ShieldAlert,
} from "lucide-react";
import { PATHWAYS } from "@/lib/pathways";

const features = [
  {
    icon: CalendarRange,
    title: "Five common routes",
    body: "Skilled Worker, family, Student → Graduate → Skilled Worker, Global Talent, and 10-year long residence.",
  },
  {
    icon: Plane,
    title: "Absence tracker",
    body: "Log trips and see the usual 180-day ILR rule plus citizenship 90 / 270 / 450-day windows.",
  },
  {
    icon: GitCompare,
    title: "Switching simulator",
    body: "Compare staying put with switching onto another MVP route, including a rough fee for the move.",
  },
  {
    icon: Banknote,
    title: "Fee calculator",
    body: "Basic Home Office fees from 8 April 2026, plus IHS, ILR, tests and citizenship.",
  },
  {
    icon: ClipboardCheck,
    title: "Document checklist",
    body: "Evidence lists tailored to the visa you hold, stored locally in this browser.",
  },
  {
    icon: Bell,
    title: "Reminders",
    body: "Visa expiry, ILR window, and tests — with a calendar file you can download.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20">
        <p className="text-xs uppercase tracking-[0.22em] text-clay">UK immigration · MVP</p>
        <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight text-navy sm:text-6xl">
          From the visa you hold to ILR — and, if you want it, British citizenship.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Plan one of five common UK routes. See a timeline, log absences, simulate a switch,
          estimate fees, and build a document list. Your plan stays in this browser.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-paper-50 hover:bg-navy-700"
          >
            Build my route <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/disclaimer" className="text-sm text-ink-muted underline-offset-4 hover:underline">
            Read the legal disclaimer first
          </Link>
        </div>
        <div className="mt-10 rounded-2xl border border-clay/30 bg-clay/10 px-5 py-4 text-sm leading-relaxed text-clay-600">
          <strong className="font-semibold">Not immigration advice.</strong> This tool does not
          assess your full case, cannot bind the Home Office, and must not be used as a substitute
          for GOV.UK guidance or advice from an OISC-regulated adviser or solicitor.
        </div>
      </section>

      <div className="hairline mx-auto max-w-6xl" />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-serif text-3xl text-navy">Routes in this MVP</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {PATHWAYS.map((pathway) => (
            <article key={pathway.id} className="rounded-2xl border border-navy/10 bg-paper-50 p-5">
              <h3 className="font-serif text-xl text-navy">{pathway.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{pathway.blurb}</p>
              <p className="mt-3 text-xs uppercase tracking-[0.14em] text-ink-faint">
                {pathway.stages.map((stage) => stage.label).join(" → ")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <h2 className="font-serif text-3xl text-navy">What the planner does</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-navy/10 bg-paper-50 p-5 shadow-card"
            >
              <feature.icon className="h-5 w-5 text-moss" />
              <h3 className="mt-3 font-serif text-xl text-navy">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 flex items-center gap-2 text-sm text-ink-muted">
          <ShieldAlert className="h-4 w-4" />
          Always re-check GOV.UK. Fees and rules change.
        </p>
      </section>
    </div>
  );
}
