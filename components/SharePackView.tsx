import { formatGbp, formatLongDate } from "@/lib/format";
import type { SharePack } from "@/lib/share-pack";

export function SharePackView({ pack }: { pack: SharePack }) {
  return (
    <div className="share-pack mt-8 space-y-6 text-sm">
      <p className="text-ink-muted">{pack.disclaimer}</p>
      <p className="text-xs text-ink-faint">
        Generated {formatLongDate(pack.generatedOn.slice(0, 10))} · encoded rules reviewed{" "}
        {formatLongDate(pack.rulesReviewedOn)}
      </p>
      <section>
        <h2 className="font-serif text-2xl text-navy">Sketch</h2>
        <p className="mt-2 text-ink">{pack.plan.summary}</p>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          <Row label="Current visa" value={pack.profile.currentVisaId} />
          <Row label="Nationality" value={pack.profile.nationality} />
          <Row label="Leave granted" value={formatLongDate(pack.profile.visaGrantedOn)} />
          <Row label="Leave expires" value={formatLongDate(pack.profile.visaExpiresOn)} />
          <Row label="ILR (sketch)" value={formatLongDate(pack.plan.ilrEligibleOn ?? "")} />
          <Row label="Citizenship (sketch)" value={formatLongDate(pack.plan.citizenshipEligibleOn ?? "")} />
          <Row label="Days away last 12 months" value={String(pack.plan.last12MonthsAway)} />
          <Row label="Fee sketch" value={formatGbp(pack.plan.feesTotalGbp)} />
          {pack.profile.englishTest ? (
            <Row
              label="English test (last 4 only)"
              value={`${pack.profile.englishTest.provider} ${pack.profile.englishTest.level}${pack.profile.englishTest.last4 ? ` · ${pack.profile.englishTest.last4}` : ""}`}
            />
          ) : null}
          {pack.profile.lifeInUkBooking ? (
            <Row
              label="Life in the UK booking"
              value={`${pack.profile.lifeInUkBooking.centre} on ${formatLongDate(pack.profile.lifeInUkBooking.bookedOn)}`}
            />
          ) : null}
        </dl>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-navy">Absences</h2>
        {pack.profile.absences.length === 0 ? (
          <p className="mt-2 text-ink-muted">None logged.</p>
        ) : (
          <ul className="mt-2 list-disc pl-5">
            {pack.profile.absences.map((trip) => (
              <li key={trip.id}>
                {formatLongDate(trip.departedOn)} – {formatLongDate(trip.returnedOn)} ({trip.place || "—"})
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="font-serif text-2xl text-navy">Checklist</h2>
        <ul className="mt-2 list-disc pl-5">
          {pack.checklist.map((item) => (
            <li key={item.id}>
              {item.checked ? "Done" : "Open"}: {item.label}
              {item.required ? " (required)" : ""}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="text-navy">{value}</dd>
    </div>
  );
}
