import Link from "next/link";
import { AuthNav } from "@/components/AuthNav";

const links = [
  { href: "/plan", label: "Planner" },
  { href: "/about", label: "How it works" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-navy/10 bg-paper-50/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-tight text-navy">
            Route to Citizenship
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-ink-muted sm:inline">
            UK path planner
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-ink-muted">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-navy">
              {link.label}
            </Link>
          ))}
          <AuthNav />
          <Link
            href="/plan"
            className="rounded-full bg-navy px-4 py-2 text-sm text-paper-50 hover:bg-navy-700"
          >
            Start a plan
          </Link>
        </nav>
      </div>
    </header>
  );
}
