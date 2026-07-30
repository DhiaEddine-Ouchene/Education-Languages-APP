"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Gamepad2, Users, BarChart3, Palette, Settings, CreditCard,
  LogOut, ChevronLeft, ChevronRight, ShieldCheck, UserCog, Receipt, Menu, X
} from "lucide-react";

const educatorLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/classes", label: "Classes", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Receipt },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: { role: "EDUCATOR" | "SUPER_ADMIN" }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = role === "SUPER_ADMIN" ? adminLinks : educatorLinks;

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-40 w-full h-[73px]">
        <div className="flex items-center font-heading font-bold text-primary text-lg">
          <Gamepad2 className="h-6 w-6 mr-2" /> EduPlay
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 top-[73px]" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={cn(
        "flex flex-col bg-card border-r border-border transition-all z-50",
        "fixed inset-y-0 left-0 top-[73px] h-[calc(100vh-73px)] md:static md:h-screen md:top-0 md:sticky",
        mobileOpen ? "translate-x-0 w-60" : "-translate-x-full md:translate-x-0",
        collapsed ? "md:w-16" : "md:w-60"
      )}>
        <div className="hidden md:flex h-16 items-center px-4 font-heading font-bold text-primary text-lg">
          <Gamepad2 className="h-6 w-6 shrink-0" />
          {!collapsed && <span className="ml-2">EduPlay</span>}
        </div>
      <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
        {links.map((l) => {
          const active = l.href === pathname || (l.href !== "/dashboard" && l.href !== "/admin" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-btn text-sm transition-colors",
                active ? "bg-primary-light text-primary-dark font-medium" : "text-txt-secondary hover:bg-background"
              )}
            >
              <l.icon className="h-5 w-5 shrink-0" />
              {!collapsed && l.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-2 border-t border-border space-y-1 mt-auto">
        {!collapsed && session?.user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            {session.user.image ? (
              <img src={session.user.image} alt={session.user.name ?? "Profile"} className="h-8 w-8 rounded-full object-cover shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary-light text-primary-dark flex items-center justify-center font-semibold shrink-0 text-sm">
                {session.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-txt-primary truncate">{session.user.name}</span>
              <span className="text-xs text-txt-secondary truncate">{session.user.email}</span>
            </div>
          </div>
        )}
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-3 py-2 rounded-btn text-sm text-txt-secondary hover:bg-background w-full">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center gap-3 px-3 py-2 rounded-btn text-sm text-txt-secondary hover:bg-background w-full">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /> Collapse</>}
        </button>
      </div>
    </aside>
    </>
  );
}
