import { notFound } from "next/navigation";
import { isSharePack } from "@/lib/share-pack";
import { hashShareToken } from "@/lib/share-token";
import { prisma } from "@/lib/prisma";
import { SharePackView } from "@/components/SharePackView";
import { LEGAL_NOTICE } from "@/lib/legal";

export const metadata = { title: "Shared plan (read-only)" };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let row: { payload: unknown; expiresAt: Date; revokedAt: Date | null; label: string } | null = null;
  try {
    row = await prisma.shareLink.findUnique({
      where: { tokenHash: hashShareToken(token) },
    });
  } catch {
    row = null;
  }

  if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now() || !isSharePack(row.payload)) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-[0.22em] text-moss">Read-only share · {row.label}</p>
      <h1 className="mt-3 font-serif text-4xl text-navy">Shared immigration sketch</h1>
      <p className="mt-4 text-sm text-clay-600">{LEGAL_NOTICE}</p>
      <p className="mt-2 text-sm text-ink-muted">
        This snapshot does not update when the owner edits their plan. It expires and can be
        revoked. Vault files and passport numbers are not included.
      </p>
      <SharePackView pack={row.payload} />
    </article>
  );
}
