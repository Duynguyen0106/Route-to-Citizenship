"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AuthNav } from "@/components/AuthNav";

const links = [
  { href: "/plan", label: "Planner" },
  { href: "/about", label: "How it works" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const onPlan = pathname === "/plan";

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-paper-50/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-paper-50"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0 shrink" onClick={() => setOpen(false)}>
          <span className="block truncate font-serif text-lg tracking-tight text-navy sm:text-xl">
            Route to Citizenship
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-ink-muted sm:block">
            UK path planner
          </span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm text-ink-muted lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-navy ${pathname === link.href ? "text-navy" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <AuthNav />
          {!onPlan && (
            <Link
              href="/plan"
              className="rounded-full bg-navy px-4 py-2 text-sm text-paper-50 hover:bg-navy-700"
            >
              Start a plan
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          {!onPlan && (
            <Link
              href="/plan"
              className="rounded-full bg-navy px-3 py-2 text-sm text-paper-50"
            >
              Plan
            </Link>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-navy/15 bg-white text-navy"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-navy/10 bg-paper-50 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-3 text-navy hover:bg-navy/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-navy/10 px-3 py-3">
              <AuthNav />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
