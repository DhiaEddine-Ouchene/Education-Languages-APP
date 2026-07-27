"use client";

import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useCallback } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";

export type SelectOption = {
  value: string;
  label: string;
  icon?: string;
  description?: string;
};

type SelectCustomProps = {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
  disabled?: boolean;
};

export function SelectCustom({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  label,
  searchable = false,
  clearable = false,
  error,
  disabled = false,
}: SelectCustomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = searchable
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.description?.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const handleSelect = (opt: SelectOption) => {
    onChange?.(opt.value);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
    setSearch("");
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
      if (e.key === "Enter" && !isOpen) {
        setIsOpen(true);
      }
    },
    [isOpen]
  );

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex items-center justify-between w-full min-h-[2.5rem] px-3 py-2 text-sm rounded-xl border transition-all",
          "bg-card hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30",
          isOpen ? "border-primary ring-2 ring-primary/20" : "border-border",
          error && "border-error ring-2 ring-error/20",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-2 truncate">
          {selected?.icon && <span className="text-lg">{selected.icon}</span>}
          <span className={cn("truncate", !selected && "text-txt-secondary")}>
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {clearable && value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-border/50 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-txt-secondary" />
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-txt-secondary transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-card border border-border rounded-xl shadow-lg animate-fade-in overflow-hidden">
          {/* Search */}
          {searchable && (
            <div className="relative border-b border-border">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-secondary" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-transparent focus:outline-none placeholder:text-txt-secondary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-border/50"
                >
                  <X className="w-3.5 h-3.5 text-txt-secondary" />
                </button>
              )}
            </div>
          )}

          {/* Options */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-txt-secondary">
                <p>No results found</p>
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 text-sm text-left transition-colors",
                      isSelected
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-txt hover:bg-background"
                    )}
                  >
                    {/* Checkmark */}
                    <span
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded border transition-all shrink-0",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-border"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>

                    {/* Icon */}
                    {opt.icon && <span className="text-lg shrink-0">{opt.icon}</span>}

                    {/* Label + Description */}
                    <div className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {opt.description && (
                        <span className="block text-xs text-txt-secondary truncate">
                          {opt.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
