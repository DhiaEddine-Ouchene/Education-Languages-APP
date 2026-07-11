"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, BookOpen, Gamepad2, ListChecks, Users, BarChart3, Store, Palette, Settings, CreditCard,
  LogOut, ChevronLeft, ChevronRight, ShieldCheck, UserCog, Receipt,
} from "lucide-react";

const educatorLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/courses", label: "Courses", icon: BookOpen },
  { href: "/dashboard/games", label: "Games", icon: Gamepad2 },
  { href: "/dashboard/vocabulary", label: "Vocabulary", icon: ListChecks },
  { href: "/dashboard/classes", label: "Classes", icon: Users },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/marketplace", label: "Marketplace", icon: Store },
  { href: "/dashboard/branding", label: "Branding", icon: Palette },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: UserCog },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: Receipt },
  { href: "/admin/marketplace", label: "Marketplace", icon: Store },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: { role: "EDUCATOR" | "SUPER_ADMIN" }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const links = role === "SUPER_ADMIN" ? adminLinks : educatorLinks;

  return (
    <aside className={cn("hidden md:flex flex-col bg-card border-r border-border h-screen sticky top-0 transition-all", collapsed ? "w-16" : "w-60")}>
      <div className="h-16 flex items-center px-4 font-heading font-bold text-primary text-lg">
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
      <div className="p-2 border-t border-border space-y-1">
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-3 px-3 py-2 rounded-btn text-sm text-txt-secondary hover:bg-background w-full">
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && "Sign out"}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-3 px-3 py-2 rounded-btn text-sm text-txt-secondary hover:bg-background w-full">
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <><ChevronLeft className="h-5 w-5" /> Collapse</>}
        </button>
      </div>
    </aside>
  );
}
