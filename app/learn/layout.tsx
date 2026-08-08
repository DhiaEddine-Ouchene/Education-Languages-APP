import { BottomNav } from "@/components/layout/BottomNav";
import { LearnHeader } from "@/components/student/LearnHeader";

export const dynamic = "force-dynamic";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-8">
      <LearnHeader appName="EduPlay" logo={null} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  );
}
