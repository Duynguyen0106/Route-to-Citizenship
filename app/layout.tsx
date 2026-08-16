import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";
import { PlanProvider } from "@/components/PlanProvider";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

const fraunces = Fraunces({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-fraunces",
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin", "latin-ext", "vietnamese"],
  variable: "--font-public-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Route to Citizenship",
    template: "%s · Route to Citizenship",
  },
  description:
    "A UK immigration route planner that maps your current visa to Indefinite Leave to Remain and British citizenship. Not immigration advice.",
  icons: {
    icon: [{ url: "/brand/logo-mark.svg", type: "image/svg+xml" }],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Route to Citizenship",
    description:
      "Plan from the visa you hold to ILR and British citizenship. Not immigration advice.",
    images: [{ url: "/brand/logo-mark-1024.png", width: 1024, height: 1024, alt: "Route to Citizenship" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" suppressHydrationWarning className={`${fraunces.variable} ${publicSans.variable}`}>
      <body className="min-h-dvh font-sans antialiased">
        <LocaleProvider>
          <PlanProvider>
          <div className="paper-grid flex min-h-dvh flex-col">
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
          </PlanProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
