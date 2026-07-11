"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, TrendingUp, Users, User } from "lucide-react";

const links = [
  { href: "/learn", label: "Home", icon: Home },
  { href: "/learn/progress", label: "Progress", icon: TrendingUp },
  { href: "/learn/classes", label: "Classes", icon: Users },
  { href: "/learn/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border flex justify-around py-2">
      {links.map((l) => {
        const active = l.href === "/learn" ? pathname === "/learn" : pathname.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={cn("flex flex-col items-center gap-0.5 text-xs px-3 py-1", active ? "text-primary font-medium" : "text-txt-secondary")}>
            <l.icon className="h-5 w-5" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
