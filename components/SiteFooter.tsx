import Link from "next/link";
import { RULES_REVIEWED_ON } from "@/lib/types";

export function SiteFooter() {
  return (
    <footer className="border-t border-navy/10 bg-navy text-paper-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <p className="max-w-3xl text-sm leading-relaxed text-paper-200/90">
          This website is a planning tool for general information only. It is{" "}
          <strong className="font-semibold text-white">not immigration advice</strong>, legal
          advice, or a Home Office service. UK immigration rules change. Always check{" "}
          <a className="underline decoration-gold/70 underline-offset-2" href="https://www.gov.uk/browse/visas-immigration">
            GOV.UK
          </a>{" "}
          or a qualified adviser regulated by the OISC or a solicitor before you apply.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-paper-200/70">
          <p>Rules encoded in this MVP were last reviewed on {RULES_REVIEWED_ON}.</p>
          <div className="flex gap-4">
            <Link href="/disclaimer" className="hover:text-white">
              Full disclaimer
            </Link>
            <Link href="/about" className="hover:text-white">
              Sources
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
