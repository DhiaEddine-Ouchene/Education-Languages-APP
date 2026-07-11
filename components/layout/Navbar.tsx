"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/marketplace", label: "Marketplace" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const dashHref = session?.user.role === "SUPER_ADMIN" ? "/admin" : session?.user.role === "EDUCATOR" ? "/dashboard" : "/learn";

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur border-b border-border">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-xl text-primary">
          <Gamepad2 className="h-6 w-6" /> EduPlay
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-txt-secondary hover:text-txt-primary">
              {l.label}
            </Link>
          ))}
          {session ? (
            <Link href={dashHref}><Button size="sm">Open app</Button></Link>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm text-txt-secondary hover:text-txt-primary">Login</Link>
              <Link href="/auth/register"><Button size="sm">Get Started</Button></Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 flex flex-col gap-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm">{l.label}</Link>
          ))}
          <Link href="/auth/login" className="text-sm">Login</Link>
          <Link href="/auth/register"><Button size="sm" className="w-full">Get Started</Button></Link>
        </div>
      )}
    </header>
  );
}
