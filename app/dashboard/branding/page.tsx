import { redirect } from "next/navigation";
import { auth, getEducatorProfile } from "@/lib/auth";
import { BrandingForm } from "@/components/dashboard/BrandingForm";

export const dynamic = "force-dynamic";

export default async function BrandingPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const profile = await getEducatorProfile(session.user.id);
  if (!profile) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-2xl">White-label branding</h1>
      {profile.subscriptionPlan === "FREE" || profile.subscriptionPlan === "STARTER" ? (
        <p className="text-sm bg-primary-light text-primary-dark rounded-card p-3">White-label branding is applied to students on the <b>Pro</b> and <b>School</b> plans. You can configure it now and it activates when you upgrade.</p>
      ) : null}
      <BrandingForm
        initial={{
          brandName: profile.brandName ?? "",
          brandLogo: profile.brandLogo ?? "",
          primaryColor: profile.primaryColor,
          accentColor: profile.accentColor,
          customDomain: profile.customDomain ?? "",
          domainVerified: profile.domainVerified,
        }}
      />
    </div>
  );
}
