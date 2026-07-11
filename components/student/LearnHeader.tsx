"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

const links = [
  { href: "/learn", label: "Home" },
  { href: "/learn/progress", label: "Progress" },
  { href: "/learn/classes", label: "Classes" },
  { href: "/learn/profile", label: "Profile" },
];

export function LearnHeader({ appName, logo }: { appName: string; logo: string | null }) {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-border">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/learn" className="flex items-center gap-2 font-heading font-bold text-primary">
          {logo ? <img src={logo} alt="" className="h-7 w-7 rounded" /> : <span className="h-7 w-7 rounded bg-primary inline-block" />}
          {appName}
        </Link>
        <nav className="hidden md:flex items-center gap-5">
          {links.map((l) => {
            const active = l.href === "/learn" ? pathname === "/learn" : pathname.startsWith(l.href);
            return <Link key={l.href} href={l.href} className={cn("text-sm", active ? "text-primary font-medium" : "text-txt-secondary")}>{l.label}</Link>;
          })}
          <button onClick={() => signOut({ callbackUrl: "/" })} aria-label="Sign out"><LogOut className="h-4 w-4 text-txt-secondary" /></button>
        </nav>
      </div>
    </header>
  );
}
