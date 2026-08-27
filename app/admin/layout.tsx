import { Sidebar } from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar role="SUPER_ADMIN" />
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto">{children}</main>
    </div>
  );
}
