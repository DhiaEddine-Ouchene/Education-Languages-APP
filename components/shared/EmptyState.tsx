import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function EmptyState({ title, description, ctaLabel, ctaHref }: { title: string; description: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="h-16 w-16 rounded-pill bg-primary-light flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-heading font-semibold text-lg mb-1">{title}</h3>
      <p className="text-txt-secondary text-sm mb-4 max-w-sm">{description}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref}>
          <Button>{ctaLabel}</Button>
        </Link>
      )}
    </div>
  );
}
