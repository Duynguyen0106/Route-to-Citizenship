import Link from "next/link";
import {
  ArrowRight,
  Bell,
  CalendarRange,
  ClipboardCheck,
  GitCompare,
  Scale,
  ShieldAlert,
} from "lucide-react";

const features = [
  {
    icon: CalendarRange,
    title: "Current route timeline",
    body: "See visa expiry, the ILR window, and an estimated citizenship date on one path.",
  },
  {
    icon: GitCompare,
    title: "Alternative routes",
    body: "Compare switches such as Skilled Worker, Global Talent, family, or Innovator Founder.",
  },
  {
    icon: Scale,
    title: "Basic eligibility checks",
    body: "Residence, absences, English, and the Life in the UK test — with gaps called out.",
  },
  {
    icon: ClipboardCheck,
    title: "Personalised checklist",
    body: "Documents tailored to your visa, stored locally in your browser.",
  },
  {
    icon: Bell,
    title: "Reminders",
    body: "Visa expiry, ILR window, and test deadlines — plus a calendar file you can download.",
  },
  {
    icon: ShieldAlert,
    title: "Not immigration advice",
    body: "Plain-English estimates only. Decisions stay with you, GOV.UK, and a regulated adviser.",
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
          Enter your immigration profile. We sketch a timeline, flag basic eligibility issues,
          suggest routes you might switch to, and build a document list. Nothing is sent to a
          server; your plan stays in this browser.
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
      </section>
    </div>
  );
}
