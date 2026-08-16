import { formatDayCount, formatLongDate } from "@/lib/format";
import type { AlternativeRoute } from "@/lib/types";

export function AlternativeRoutes({
  alternatives,
  hasIlrPath,
}: {
  alternatives: AlternativeRoute[];
  hasIlrPath: boolean;
}) {
  if (alternatives.length === 0) {
    return (
      <p className="mt-4 rounded-2xl border border-navy/10 bg-paper-50 p-5 text-sm text-ink-muted">
        {hasIlrPath
          ? "No clearly faster qualifying switches were identified from this profile. That does not mean no options exist."
          : "No modelled switch was available. A regulated adviser may still see a path this MVP does not encode."}
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-navy/10 bg-paper-50">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-navy/5 text-xs uppercase tracking-wide text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Route</th>
            <th className="px-4 py-3 font-medium">Why consider it</th>
            <th className="px-4 py-3 font-medium">Est. ILR</th>
            <th className="px-4 py-3 font-medium">In-country?</th>
          </tr>
        </thead>
        <tbody>
          {alternatives.map((alt) => (
            <tr key={alt.routeId} className="border-t border-navy/10 align-top">
              <td className="px-4 py-3">
                <a href={alt.officialUrl} className="font-medium text-navy underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {alt.name}
                </a>
                {alt.daysSavedVsCurrent !== null && alt.daysSavedVsCurrent > 30 && (
                  <p className="mt-1 text-xs text-moss">
                    Could be ~{formatDayCount(alt.daysSavedVsCurrent)} sooner
                  </p>
                )}
              </td>
              <td className="px-4 py-3 text-ink-muted">
                {alt.reason}
                {alt.caveats[0] && (
                  <p className="mt-2 text-xs text-clay-600">{alt.caveats[0]}</p>
                )}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                {alt.ilrEligibleOn ? formatLongDate(alt.ilrEligibleOn) : "—"}
              </td>
              <td className="px-4 py-3">{alt.inCountrySwitch ? "Often yes" : "Usually from overseas"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
