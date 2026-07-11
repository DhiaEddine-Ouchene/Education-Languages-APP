import { prisma } from "./prisma";
import type { EducatorProfile } from "@prisma/client";

export type Branding = {
  appName: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  isWhiteLabel: boolean;
};

export const DEFAULT_BRANDING: Branding = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "EduPlay",
  logo: null,
  primaryColor: "#7F77DD",
  accentColor: "#1D9E75",
  isWhiteLabel: false,
};

export function toBranding(profile: EducatorProfile | null): Branding {
  if (!profile) return DEFAULT_BRANDING;
  const whiteLabel = profile.subscriptionPlan === "PRO" || profile.subscriptionPlan === "SCHOOL";
  return {
    appName: whiteLabel && profile.brandName ? profile.brandName : DEFAULT_BRANDING.appName,
    logo: whiteLabel ? profile.brandLogo : null,
    primaryColor: whiteLabel ? profile.primaryColor : DEFAULT_BRANDING.primaryColor,
    accentColor: whiteLabel ? profile.accentColor : DEFAULT_BRANDING.accentColor,
    isWhiteLabel: whiteLabel && !!profile.brandName,
  };
}

export async function getBrandingByDomain(domain: string): Promise<Branding> {
  const profile = await prisma.educatorProfile.findFirst({
    where: { customDomain: domain, domainVerified: true },
  });
  return toBranding(profile);
}

export async function getStudentBranding(studentId: string): Promise<Branding> {
  const membership = await prisma.classMember.findFirst({
    where: { studentId },
    orderBy: { joinedAt: "desc" },
    include: { class: { include: { educator: true } } },
  });
  return toBranding(membership?.class.educator ?? null);
}

export function brandingCssVars(b: Branding): Record<string, string> {
  return { "--primary": b.primaryColor, "--accent": b.accentColor };
}
