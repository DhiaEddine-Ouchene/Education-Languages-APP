import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PlatformSettingsForm } from "@/components/admin/PlatformSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/");

  const settings = await prisma.platformSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl">Platform settings</h1>
      <PlatformSettingsForm
        revenueSharePct={settings.revenueSharePct}
        promoCodes={(settings.promoCodes as { code: string; discountPct: number }[]) ?? []}
        emailTemplates={(settings.emailTemplates as Record<string, string>) ?? {}}
      />
    </div>
  );
}
