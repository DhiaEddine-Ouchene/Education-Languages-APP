import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function StatCard({ icon: Icon, value, label, trend }: { icon: LucideIcon; value: string | number; label: string; trend?: number }) {
  return (
    <Card>
      <CardContent className="pt-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-btn bg-primary-light flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-heading font-bold text-2xl leading-tight">{value}</p>
          <p className="text-xs text-txt-secondary">{label}</p>
          {trend !== undefined && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${trend >= 0 ? "text-accent" : "text-error"}`}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend)}%
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
