import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getBrandingByDomain, getStudentBranding, DEFAULT_BRANDING } from "@/lib/branding";
import { BottomNav } from "@/components/layout/BottomNav";
import { LearnHeader } from "@/components/student/LearnHeader";

export const dynamic = "force-dynamic";

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const brandDomain = headers().get("x-brand-domain");
  const branding = brandDomain
    ? await getBrandingByDomain(brandDomain)
    : session?.user
      ? await getStudentBranding(session.user.id)
      : DEFAULT_BRANDING;

  return (
    <div
      className="min-h-screen pb-20 md:pb-8"
      style={{ "--primary": branding.primaryColor, "--accent": branding.accentColor } as React.CSSProperties}
    >
      <LearnHeader appName={branding.appName} logo={branding.logo} />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
