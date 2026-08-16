import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LastReviewed } from "@/components/LastReviewed";
import { OfficialGovukLinks } from "@/components/OfficialGovukLinks";
import { ReportInaccuracyButton } from "@/components/ReportInaccuracyButton";
import { LEGAL_NOTICE } from "@/lib/legal";
import { listRoutes, tryGetRouteByKey } from "@/lib/routes";

type Params = { key: string };

export function generateStaticParams() {
  return listRoutes().map((route) => ({ key: route.key }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { key } = await params;
  const route = tryGetRouteByKey(key);
  if (!route) return { title: "Route" };
  return { title: route.name };
}

export default async function RoutePage({ params }: { params: Promise<Params> }) {
  const { key } = await params;
  const route = tryGetRouteByKey(key);
  if (!route) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <LastReviewed date={route.lastReviewedOn} />
      <h1 className="mt-3 font-serif text-4xl text-navy">{route.name}</h1>
      <p className="mt-4 text-lg leading-relaxed text-ink-muted">{route.notes}</p>
      <p className="mt-4 rounded-xl border border-clay/25 bg-clay/10 px-4 py-3 text-sm text-clay-600">
        {LEGAL_NOTICE}
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-2xl text-navy">Official GOV.UK pages</h2>
        <p className="mt-2 text-sm text-ink-muted">
          These are the Home Office pages this planner is based on. They always take priority over
          this tool.
        </p>
        <OfficialGovukLinks links={route.officialUrls} />
      </section>

      <dl className="mt-10 grid gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-navy/10 bg-paper-50 p-4">
          <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">Usual ILR clock</dt>
          <dd className="mt-1 text-navy">
            {route.minYearsToILR ? `${route.minYearsToILR} years` : "Not on this visa alone"}
          </dd>
        </div>
        <div className="rounded-xl border border-navy/10 bg-paper-50 p-4">
          <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">Absence limit</dt>
          <dd className="mt-1 text-navy">
            {route.absenceLimitPerYear ? `${route.absenceLimitPerYear} days in 12 months` : "n/a"}
          </dd>
        </div>
        <div className="rounded-xl border border-navy/10 bg-paper-50 p-4">
          <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">English</dt>
          <dd className="mt-1 text-navy">{route.englishRequirement ?? "Not required in this planner"}</dd>
        </div>
        <div className="rounded-xl border border-navy/10 bg-paper-50 p-4">
          <dt className="text-xs uppercase tracking-[0.16em] text-ink-faint">Life in the UK</dt>
          <dd className="mt-1 text-navy">{route.lifeInUKRequired ? "Usually required for ILR" : "Not required"}</dd>
        </div>
      </dl>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/plan"
          className="rounded-full bg-navy px-5 py-2 text-sm text-paper-50 hover:bg-navy-700"
        >
          Plan this route
        </Link>
        <ReportInaccuracyButton routeKey={route.key} />
      </div>
    </article>
  );
}
