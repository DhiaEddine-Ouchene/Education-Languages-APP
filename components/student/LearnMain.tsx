"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function LearnMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Course detail pages get full-width, no padding, overflow-hidden
  const isCoursePage = /^\/learn\/course\/[^/]+/.test(pathname);

  if (isCoursePage) {
    // Full-bleed: no padding, no max-width, takes remaining height after header
    return (
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto px-4 md:px-8 py-6 w-full pb-20 md:pb-8">
      {children}
    </main>
  );
}
