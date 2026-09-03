"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  collapsed = false,
  iconOnly = false,
  className,
}: {
  collapsed?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("lingokit-theme", next ? "dark" : "light");
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      type="button"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-btn text-sm text-txt-secondary hover:bg-background transition-colors",
        className
      )}
    >
      {mounted && dark ? <Sun className="h-5 w-5 shrink-0 text-amber-500" /> : <Moon className="h-5 w-5 shrink-0" />}
      {!collapsed && !iconOnly && (mounted && dark ? "Light mode" : "Dark mode")}
    </button>
  );
}
