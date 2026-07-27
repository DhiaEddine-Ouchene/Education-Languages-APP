"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
};

type Props = {
  items: ActionMenuItem[];
  /** Optional divider positions — insert a divider after these item indices */
  dividersAfter?: number[];
  align?: "start" | "end";
};

export function ActionMenu({ items, dividersAfter = [], align = "end" }: Props) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, idx: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (idx + 1) % items.length;
      setFocusedIdx(next);
      (e.currentTarget.parentElement?.children[next] as HTMLElement)?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (idx - 1 + items.length) % items.length;
      setFocusedIdx(prev);
      (e.currentTarget.parentElement?.children[prev] as HTMLElement)?.focus();
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      items[idx].onClick();
      setOpen(false);
    }
  }, [items]);

  return (
    <div className="relative inline-flex">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
          open ? "bg-[#E8E8E8]" : "bg-[#F1F1F1] hover:bg-[#E8E8E8]"
        )}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.5" fill="#6B7280" /><circle cx="12" cy="12" r="1.5" fill="#6B7280" /><circle cx="12" cy="19" r="1.5" fill="#6B7280" />
        </svg>
      </button>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className={cn(
            "absolute top-full mt-1.5 z-50 min-w-[200px] max-w-[220px]",
            "bg-[#FAFAFA] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] p-1.5",
            align === "end" ? "right-0" : "left-0"
          )}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            const isDestructive = item.variant === "destructive";
            const showDivider = dividersAfter.includes(i);

            return (
              <div key={i}>
                <button
                  role="menuitem"
                  tabIndex={i === focusedIdx ? 0 : -1}
                  onFocus={() => setFocusedIdx(i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onClick={() => { item.onClick(); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center justify-between h-9 px-2 rounded-md transition-colors text-sm font-medium outline-none",
                    isDestructive ? "text-red-600" : "text-[#1A1A2E]",
                    "hover:bg-[#F1F1F1] focus-visible:bg-[#F1F1F1]"
                  )}
                >
                  <span>{item.label}</span>
                  <Icon className={cn("w-4 h-4", isDestructive ? "text-red-500" : "text-[#9CA3AF]")} />
                </button>
                {showDivider && i < items.length - 1 && (
                  <div className="h-px bg-[#E5E7EB] mx-1 my-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
