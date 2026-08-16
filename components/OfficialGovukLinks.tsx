import type { OfficialLink } from "@/lib/legal";

export function OfficialGovukLinks({ links }: { links: OfficialLink[] }) {
  return (
    <ul className="mt-4 space-y-2 text-sm">
      {links.map((link) => (
        <li key={link.url + link.label}>
          <a
            href={link.url}
            className="text-navy underline underline-offset-2 hover:text-navy-700"
            target="_blank"
            rel="noreferrer"
          >
            {link.label} on GOV.UK
          </a>
        </li>
      ))}
    </ul>
  );
}
