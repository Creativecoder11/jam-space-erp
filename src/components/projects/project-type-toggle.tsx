"use client";

import { cn } from "@/lib/utils";

export type ProjectTypeValue = "INTERIOR_DESIGN" | "REAL_ESTATE" | "BOTH";

interface ProjectTypeToggleProps {
  value?: ProjectTypeValue;
  onChange: (value: ProjectTypeValue) => void;
  error?: string;
}

const TYPES = [
  { id: "INTERIOR_DESIGN" as const, label: "Interior Design", short: "ID" },
  { id: "REAL_ESTATE" as const,     label: "Real Estate",     short: "RE" },
];

function toFlags(type?: ProjectTypeValue) {
  return {
    interior: type === "INTERIOR_DESIGN" || type === "BOTH",
    real:     type === "REAL_ESTATE"     || type === "BOTH",
  };
}

function toType(interior: boolean, real: boolean): ProjectTypeValue | undefined {
  if (interior && real) return "BOTH";
  if (interior) return "INTERIOR_DESIGN";
  if (real)     return "REAL_ESTATE";
  return undefined;
}

export function ProjectTypeToggle({ value, onChange, error }: ProjectTypeToggleProps) {
  const { interior, real } = toFlags(value);

  const toggle = (which: "interior" | "real") => {
    const next = which === "interior"
      ? toType(!interior, real)
      : toType(interior, !real);
    if (next) onChange(next);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        {TYPES.map(({ id, label }) => {
          const active = id === "INTERIOR_DESIGN" ? interior : real;
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggle(id === "INTERIOR_DESIGN" ? "interior" : "real")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      {value === "BOTH" && (
        <p className="text-xs text-muted-foreground">Both types selected</p>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}
