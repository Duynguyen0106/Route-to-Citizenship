"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { AuthNav } from "@/components/AuthNav";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLocale } from "@/components/LocaleProvider";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t } = useLocale();
  const onPlan = pathname === "/plan";
  const links = [
    { href: "/plan", label: t("nav.planner") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/advisers", label: t("nav.advisers") },
    { href: "/employers", label: t("nav.employers") },
    { href: "/intelligence", label: t("nav.intelligence") },
    { href: "/security", label: t("nav.security") },
    { href: "/about", label: t("nav.about") },
    { href: "/disclaimer", label: t("nav.disclaimer") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-paper-50/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-paper-50"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="min-w-0 shrink" onClick={() => setOpen(false)}>
          <span className="block truncate font-serif text-lg tracking-tight text-navy sm:text-xl">
            {t("brand")}
          </span>
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-ink-muted sm:block">
            {t("brand.tag")}
          </span>
        </Link>

        <nav className="hidden items-center gap-4 text-sm text-ink-muted lg:flex" aria-label={t("brand")}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href ? "page" : undefined}
              className={`inline-flex min-h-11 items-center hover:text-navy ${pathname === link.href ? "text-navy" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <AuthNav />
          <LanguageSwitcher compact />
          {!onPlan && (
            <Link
              href="/plan"
              className="inline-flex min-h-11 items-center rounded-full bg-navy px-4 py-2 text-sm text-paper-50 hover:bg-navy-700"
            >
              {t("nav.start")}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          {!onPlan && (
            <Link
              href="/plan"
              className="inline-flex min-h-11 items-center rounded-full bg-navy px-3 py-2 text-sm text-paper-50"
            >
              {t("nav.plan")}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-navy/15 bg-white text-navy"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? t("nav.close") : t("nav.menu")}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            <span className="sr-only">{open ? t("nav.close") : t("nav.menu")}</span>
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="border-t border-navy/10 bg-paper-50 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1 text-sm" aria-label={t("nav.menu")}>
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? "page" : undefined}
                className="rounded-xl px-3 py-3 text-navy hover:bg-navy/5"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-navy/10 px-3 py-3">
              <AuthNav />
            </div>
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
