import Link from "next/link";

export function ReportInaccuracyButton({
  routeKey,
  variant = "button",
}: {
  routeKey?: string;
  variant?: "button" | "footer" | "link";
}) {
  const href = routeKey ? `/report?route=${encodeURIComponent(routeKey)}` : "/report";

  if (variant === "footer" || variant === "link") {
    return (
      <Link href={href} className={variant === "footer" ? "hover:text-white" : "underline"}>
        Report inaccurate information
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-full border border-navy/20 bg-white px-4 py-2 text-sm text-navy hover:border-clay/50 hover:bg-clay/10"
    >
      Report inaccurate information
    </Link>
  );
}
