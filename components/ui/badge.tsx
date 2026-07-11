import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-primary-light text-primary-dark",
  accent: "bg-accent-light text-accent",
  warning: "bg-orange-100 text-warning",
  error: "bg-red-100 text-error",
  outline: "border border-border text-txt-secondary",
};

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return <span className={cn("inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium", variants[variant], className)} {...props} />;
}
