const WAYPOINTS = {
  visa: { cx: 15, cy: 47, r: 3.75, fill: "#F6F1E8" },
  ilr: { cx: 32, cy: 32, r: 4.25, fill: "#C4A35A" },
  citizenship: { cx: 49, cy: 17, r: 5, fill: "#2F5D45" },
} as const;

export type BrandMarkVariant = "badge" | "ghost";

export function BrandMark({
  size = 36,
  variant = "badge",
  className,
  title = "Route to Citizenship",
  decorative = false,
}: {
  size?: number;
  variant?: BrandMarkVariant;
  className?: string;
  title?: string;
  decorative?: boolean;
}) {
  const labelled = !decorative;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role={labelled ? "img" : undefined}
      aria-hidden={decorative ? true : undefined}
      aria-label={labelled ? title : undefined}
    >
      {variant === "badge" ? <rect width="64" height="64" rx="16" fill="#1B2A4A" /> : null}
      <rect
        x="5"
        y="5"
        width="54"
        height="54"
        rx="12"
        fill="none"
        stroke="#C4A35A"
        strokeWidth="1.5"
      />
      <path
        d="M15 47 L32 32 L49 17"
        fill="none"
        stroke="#C4A35A"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={WAYPOINTS.visa.cx} cy={WAYPOINTS.visa.cy} r={WAYPOINTS.visa.r} fill={WAYPOINTS.visa.fill} />
      <circle cx={WAYPOINTS.ilr.cx} cy={WAYPOINTS.ilr.cy} r={WAYPOINTS.ilr.r} fill={WAYPOINTS.ilr.fill} />
      <circle
        cx={WAYPOINTS.citizenship.cx}
        cy={WAYPOINTS.citizenship.cy}
        r={WAYPOINTS.citizenship.r}
        fill={WAYPOINTS.citizenship.fill}
      />
      <circle cx={WAYPOINTS.citizenship.cx} cy={WAYPOINTS.citizenship.cy} r="1.8" fill="#F6F1E8" />
    </svg>
  );
}

export const BRAND_MARK_WAYPOINTS = WAYPOINTS;
