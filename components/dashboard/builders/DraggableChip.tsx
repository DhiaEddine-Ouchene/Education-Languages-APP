"use client";

import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { GripVertical } from "lucide-react";

export type ChipData = {
  id: string;
  word: string;
  translation: string;
  exampleSentence?: string;
};

type Props = {
  chip: ChipData;
  showTranslation?: boolean;
  size?: "sm" | "md" | "lg";
};

export function DraggableChip({ chip, showTranslation = true, size = "md" }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `chip-${chip.id}`,
    data: chip,
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    zIndex: 50,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-2 bg-white border rounded-xl transition-all cursor-grab active:cursor-grabbing select-none",
        isDragging ? "shadow-xl opacity-90 scale-105 ring-2 ring-primary/30" : "shadow-sm hover:shadow-md hover:border-primary/40",
        size === "sm" ? "px-2.5 py-1.5 text-xs" : size === "md" ? "px-3 py-2 text-sm" : "px-4 py-3 text-base",
        "border-border/60"
      )}
    >
      <GripVertical className={cn("shrink-0 text-txt-secondary/40", size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5")} />
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-txt truncate">{chip.word}</div>
        {showTranslation && chip.translation && (
          <div className={cn("text-txt-secondary truncate", size === "sm" ? "text-[10px]" : "text-xs")}>{chip.translation}</div>
        )}
      </div>
    </div>
  );
}
