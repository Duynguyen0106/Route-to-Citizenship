import type { Metadata } from "next";
import Link from "next/link";
import { RULES_REVIEWED_ON } from "@/lib/types";

export const metadata: Metadata = { title: "How it works" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Method</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">How the estimates are made</h1>
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink">
        <p>
          You pick a current UK visa. The planner covers the original five paths (Skilled Worker;
          family; Student → Graduate → Skilled Worker; Global Talent; 10-year long residence) and
          also Innovator Founder, Scale-up, International Sportsperson, Minister of Religion, Global
          Business Mobility, Youth Mobility, Ancestry, BN(O), HPI, protection, EUSS, dependants, and
          child registration. It can chain planned switches, combine lawful time toward 10-year long
          residence, and sketch ILR or registration for a household.
        </p>
        <p>
          ILR applications can often be submitted up to 28 days before the qualifying date. British
          citizenship is estimated as 12 months after ILR, or — if you are married to a British
          citizen — the later of ILR and 3 years’ residence (ILR must still come first). Children
          born in the UK whose parent later settles, or children under 18 with a British parent, may
          register rather than naturalise. These are common patterns — not a full reading of the
          Nationality Act or the Immigration Rules.
        </p>
        <p>
          The absence tracker counts whole days from departure up to (not including) the return
          date, then checks a rolling 12-month window against 180 days and citizenship limits of
          90 / 270 / 450 days. The switching simulator is a what-if: it does not check salary,
          endorsement or relationship rules. The fee calculator uses Home Office amounts from 8
          April 2026 plus a typical English-test estimate.
        </p>
        <p>
          The timeline includes typical Home Office decision waits and application windows — for
          example, ILR can usually be submitted up to 28 days before the qualifying date. A
          colour-coded calendar sketches continuous residence from logged trips, and a “what if”
          tool lets you test an extra absence without saving it. Decision waits and calendar colours
          are estimates, not a Home Office calculation.
        </p>
        <p>
          Official application forms stay on GOV.UK and in your UKVI account. This planner can copy
          dates into a pack for you to paste, but it cannot pre-fill or submit a Home Office form,
          check eVisa status, or read VFS/TLS appointment slots. English and Life in the UK tests are
          booked on the provider or GOV.UK sites; results are saved here only if you type them.
          Calendar (.ics) import and optional GPS can suggest absences — there is no Google, Outlook
          or TripIt login. Reminders are calendar files, browser alerts, or your own email — GOV.UK
          Notify is only for public-sector services. You can export a redacted JSON or PDF, or
          (when signed in) a revocable read-only link.
        </p>
        <p>
          Encoded rules were last reviewed on <strong>{RULES_REVIEWED_ON}</strong>. The planner can
          poll the official GOV.UK Content API for page update timestamps (not HTML scraping) and
          keeps a versioned list of facts it actually encodes — for example the 8 April 2026 fee
          table versus earlier tables whose amounts are not invented here. Official explanations
          live on GOV.UK, including{" "}
          <a className="underline" href="https://www.gov.uk/indefinite-leave-to-remain">
            Indefinite leave to remain
          </a>
          ,{" "}
          <a className="underline" href="https://www.gov.uk/british-citizenship">
            British citizenship
          </a>
          , and each visa page linked from your plan. If something looks wrong,{" "}
          <Link href="/report" className="text-navy underline">
            report inaccurate information
          </Link>
          .
        </p>
        <p>
          Readiness scores, route rankings and anonymous timeline comparisons are sketches from
          your answers. They are not a model trained on Home Office files and they are not an
          approval probability. The guidance assistant answers from a short FAQ with a legal
          disclaimer on every reply.
        </p>
        <p>
          Signed-in accounts store the plan in a local database (email, visa type, dates, absences,
          route selection, reminders). Passport numbers are not collected. Guest plans stay in this
          browser only. Optional document copies in the vault are encrypted on this device and never
          uploaded; pasted text is scanned locally so expiry dates can populate reminders, and only
          the last four characters of a detected identity number are kept.
        </p>
        <p>
          <Link href="/plan" className="text-navy underline">
            Open the planner
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
