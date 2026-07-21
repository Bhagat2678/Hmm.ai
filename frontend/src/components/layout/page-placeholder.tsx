import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PagePlaceholderProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export function PagePlaceholder({
  eyebrow = "Coming in a later phase",
  title,
  description,
  icon,
  children,
  className,
}: PagePlaceholderProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            {eyebrow}
          </p>
          <h2 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        {icon && (
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 ring-1 ring-primary/25">
            {icon}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 shadow-sm">
        <div className="flex flex-col items-start gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden />
            Placeholder view
          </div>
          <p className="text-sm text-muted-foreground">
            This surface is reserved. Application shell, navigation, theming, and
            routing are wired up in Phase 1. Data, API integration, and interactive
            components will land in later phases per the Frontend Functional
            Specification.
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
