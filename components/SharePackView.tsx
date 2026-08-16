import { formatGbp, formatLongDate } from "@/lib/format";
import { PRINT_COLOURS as C } from "@/lib/print-theme";
import type { SharePack } from "@/lib/share-pack";

export function SharePackView({ pack }: { pack: SharePack }) {
  return (
    <article className="share-pack mx-auto max-w-3xl text-sm" style={{ color: C.ink }}>
      <header
        className="share-pack-masthead rounded-2xl px-6 py-5"
        style={{ backgroundColor: C.navy, color: C.navyInk }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.22em]"
          style={{ color: C.gold }}
        >
          Route to Citizenship
        </p>
        <h1 className="mt-2 font-serif text-3xl" style={{ color: C.navyInk }}>
          Immigration sketch
        </h1>
        <p className="mt-2 text-xs" style={{ color: C.gold }}>
          Generated {formatLongDate(pack.generatedOn.slice(0, 10))} · encoded rules reviewed{" "}
          {formatLongDate(pack.rulesReviewedOn)}
        </p>
      </header>

      <p className="mt-5 text-sm leading-relaxed" style={{ color: C.clay }}>
        {pack.disclaimer}
      </p>

      <section
        className="share-pack-card mt-6 rounded-2xl border p-5"
        style={{ backgroundColor: C.paper50, borderColor: "rgba(27, 42, 74, 0.14)" }}
      >
        <h2
          className="font-serif text-2xl"
          style={{ color: C.navy, borderBottom: `3px solid ${C.gold}`, paddingBottom: 8 }}
        >
          Sketch
        </h2>
        <p className="mt-3 leading-relaxed" style={{ color: C.ink }}>
          {pack.plan.summary}
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row label="Current visa" value={pack.profile.currentVisaId} />
          <Row label="Nationality" value={pack.profile.nationality} />
          <Row label="Leave granted" value={formatLongDate(pack.profile.visaGrantedOn)} />
          <Row label="Leave expires" value={formatLongDate(pack.profile.visaExpiresOn)} />
          <Row label="ILR (sketch)" value={formatLongDate(pack.plan.ilrEligibleOn ?? "")} />
          <Row
            label="Citizenship (sketch)"
            value={formatLongDate(pack.plan.citizenshipEligibleOn ?? "")}
          />
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

      <section
        className="share-pack-card mt-6 rounded-2xl border p-5"
        style={{ backgroundColor: C.paper50, borderColor: "rgba(27, 42, 74, 0.14)" }}
      >
        <h2
          className="font-serif text-2xl"
          style={{ color: C.navy, borderBottom: `3px solid ${C.gold}`, paddingBottom: 8 }}
        >
          Absences
        </h2>
        {pack.profile.absences.length === 0 ? (
          <p className="mt-3" style={{ color: C.inkMuted }}>
            None logged.
          </p>
        ) : (
          <ul className="mt-3 list-disc pl-5" style={{ color: C.ink }}>
            {pack.profile.absences.map((trip) => (
              <li key={trip.id}>
                {formatLongDate(trip.departedOn)} – {formatLongDate(trip.returnedOn)} (
                {trip.place || "—"})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        className="share-pack-card mt-6 rounded-2xl border p-5"
        style={{ backgroundColor: C.paper50, borderColor: "rgba(27, 42, 74, 0.14)" }}
      >
        <h2
          className="font-serif text-2xl"
          style={{ color: C.navy, borderBottom: `3px solid ${C.gold}`, paddingBottom: 8 }}
        >
          Checklist
        </h2>
        <ul className="mt-3 space-y-2">
          {pack.checklist.map((item) => (
            <li key={item.id} style={{ color: item.checked ? C.moss : C.clay }}>
              <span className="font-semibold">{item.checked ? "Done" : "Open"}</span>
              {": "}
              <span style={{ color: C.ink }}>
                {item.label}
                {item.required ? " (required)" : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide" style={{ color: C.moss }}>
        {label}
      </dt>
      <dd className="font-semibold" style={{ color: C.navy }}>
        {value}
      </dd>
    </div>
  );
}
