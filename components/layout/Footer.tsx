import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-heading font-bold text-primary mb-2">
            <Gamepad2 className="h-5 w-5" /> EduPlay
          </div>
          <p className="text-txt-secondary">Build and sell interactive language learning games.</p>
        </div>
        <div>
          <p className="font-semibold mb-2">Product</p>
          <ul className="space-y-1 text-txt-secondary">
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/marketplace">Marketplace</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Account</p>
          <ul className="space-y-1 text-txt-secondary">
            <li><Link href="/auth/login">Login</Link></li>
            <li><Link href="/auth/register">Register</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold mb-2">Social</p>
          <ul className="space-y-1 text-txt-secondary">
            <li><a href="https://twitter.com" target="_blank" rel="noreferrer">Twitter</a></li>
            <li><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-txt-secondary">
        © {new Date().getFullYear()} EduPlay. All rights reserved.
      </div>
    </footer>
  );
}
