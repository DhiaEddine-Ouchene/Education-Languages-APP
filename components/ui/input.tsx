import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-btn border border-border bg-card px-3 py-2 text-sm placeholder:text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-btn border border-border bg-card px-3 py-2 text-sm placeholder:text-txt-secondary focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-btn border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary",
        className
      )}
      {...props}
    />
  )
);
Select.displayName = "Select";
