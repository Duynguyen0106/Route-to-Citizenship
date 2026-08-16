import { prisma } from "./prisma";

export async function erasePersonalData(userId: string, email: string): Promise<{
  account: boolean;
  enquiries: number;
  reports: number;
  shareLinks: number;
}> {
  const normalised = email.trim().toLowerCase();
  let enquiries = 0;
  let reports = 0;
  let shareLinks = 0;

  try {
    const enquiryResult = await prisma.billingEnquiry.deleteMany({
      where: { OR: [{ userId }, { email: normalised }] },
    });
    enquiries = enquiryResult.count;
  } catch {
    /* table may be missing in older databases */
  }

  try {
    const reportResult = await prisma.inaccuracyReport.deleteMany({
      where: { contactEmail: normalised },
    });
    reports = reportResult.count;
  } catch {
    /* optional */
  }

  try {
    const shareResult = await prisma.shareLink.deleteMany({
      where: { userId },
    });
    shareLinks = shareResult.count;
  } catch {
    /* optional until ShareLink.userId is migrated */
  }

  await prisma.user.delete({ where: { id: userId } });
  return { account: true, enquiries, reports, shareLinks };
}
