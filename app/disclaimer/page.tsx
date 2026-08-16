import type { Metadata } from "next";

export const metadata: Metadata = { title: "Disclaimer" };

export default function DisclaimerPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-clay">Legal</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">This is not immigration advice</h1>
      <div className="mt-8 space-y-5 text-[17px] leading-relaxed text-ink">
        <p>
          Route to Citizenship is a self-serve planning prototype. It produces estimates from the
          dates and answers you type in, using simplified versions of common UK Immigration Rules
          as they are publicly described on GOV.UK.
        </p>
        <p>
          It is <strong>not</strong> immigration advice, legal advice, financial advice, or a
          decision. It is not provided by the Home Office, UKVI, or any government department. It
          does not create a client relationship with you.
        </p>
        <p>In particular, the planner does not:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>check salary thresholds, going rates, or sponsor licence validity;</li>
          <li>apply the full continuous-residence or good-character rules to your facts;</li>
          <li>consider criminality, NHS debt, litigation, or deception issues;</li>
          <li>guarantee that a switch between visas is available in your circumstances;</li>
          <li>file, submit, or track any application;</li>
          <li>pre-fill or submit UKVI forms, or read your eVisa without you using GOV.UK;</li>
          <li>book IELTS, Trinity or Life in the UK slots, or read live appointment calendars;</li>
          <li>estimate a percentage chance that the Home Office will approve your case;</li>
          <li>replace a regulated adviser — the on-site assistant is a FAQ, not OISC advice.</li>
        </ul>
        <p>
          Immigration rules, fees, and forms change — sometimes with little notice. Before you
          spend money or change your status, read the current pages on{" "}
          <a className="underline" href="https://www.gov.uk/browse/visas-immigration">
            GOV.UK
          </a>{" "}
          and, where your case is not straightforward, take advice from a person authorised under
          the Immigration and Asylum Act 1999 (typically an OISC-regulated adviser or a solicitor).
        </p>
        <p>
          Guest profiles stay in this browser&apos;s local storage. Signed-in accounts store visa
          type, dates, nationality, absences and reminders against an email address — not passport
          numbers or Home Office identity documents. Clearing site data deletes a guest plan.
          Do not enter information you would not want stored on a shared computer.
        </p>
        <p>
          <a className="underline" href="/privacy">
            Privacy and data minimisation
          </a>{" "}
          ·{" "}
          <a className="underline" href="/report">
            Report inaccurate information
          </a>
        </p>
      </div>
    </article>
  );
}
