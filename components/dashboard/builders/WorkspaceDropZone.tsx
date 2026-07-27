"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

type Props = {
  id: string;
  children?: React.ReactNode;
  className?: string;
  placeholder?: string;
  accept?: string[];
  minHeight?: string;
};

export function WorkspaceDropZone({ id, children, className, placeholder, minHeight }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id, data: { accept: "chip" } });

  const isEmpty = !children || (Array.isArray(children) && children.length === 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 border-dashed transition-all duration-200",
        isOver ? "border-primary bg-primary/[0.04] shadow-inner scale-[1.01]" : "border-border/50 hover:border-primary/30",
        isEmpty && "flex items-center justify-center",
        className
      )}
      style={minHeight ? { minHeight } : undefined}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center gap-2 text-txt-secondary/60 py-8">
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">{placeholder || "Drop items here"}</span>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
