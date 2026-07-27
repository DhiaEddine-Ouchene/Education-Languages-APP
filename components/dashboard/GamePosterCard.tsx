"use client";

import { cn } from "@/lib/utils";
import { type GameTypeMeta, CATEGORY_META, POSTER_THEMES } from "@/lib/game-type-metadata";
import { GamePreviewImage } from "@/components/dashboard/GamePreviewImage";
import {
  BookOpen, PenTool, Headphones, Edit3,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, PenTool, Headphones, Edit3,
};

type Props = {
  game: GameTypeMeta;
  onClick?: () => void;
};

export function GamePosterCard({ game, onClick }: Props) {
  const theme = POSTER_THEMES[game.category];
  const catMeta = CATEGORY_META[game.category];
  const CategoryIcon = ICON_MAP[catMeta.icon] || BookOpen;

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-64 group cursor-pointer text-left"
    >
        {/* Poster visual — game screenshot */}
        <div
          className={cn(
            "relative rounded-2xl overflow-hidden mb-3 shadow-lg",
            "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
            "group-hover:-translate-y-3 group-hover:scale-[1.02] group-hover:shadow-xl",
          )}
        >
          <GamePreviewImage
            type={game.type}
            title={game.title}
            className="w-full rounded-none"
          />

        {/* Popular badge */}
        {game.popular && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm uppercase tracking-wider">
            Popular
          </div>
        )}
      </div>

      {/* Title + category */}
      <div>
        <h3 className="font-heading font-semibold text-sm text-txt group-hover:text-primary transition-colors">
          {game.title}
        </h3>
        <div className="flex items-center gap-1.5 mt-1">
          <CategoryIcon className={cn("w-3 h-3", theme.iconColor)} />
          <span className="text-xs text-txt-secondary capitalize">{game.category}</span>
        </div>
      </div>
    </button>
  );
}
