import { BottomNav } from "@/components/layout/BottomNav";
import { LearnHeader } from "@/components/student/LearnHeader";
import { LearnMain } from "@/components/student/LearnMain";

export const dynamic = "force-dynamic";

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <LearnHeader appName="LingoKit" logo={null} />
      <LearnMain>{children}</LearnMain>
      <BottomNav />
    </div>
  );
}
