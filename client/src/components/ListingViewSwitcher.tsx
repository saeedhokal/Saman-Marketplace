import { LayoutGrid, Rows3, Grid3x3, Square } from "lucide-react";
import { useListingView, type ListingView } from "@/hooks/use-listing-view";
import { cn } from "@/lib/utils";

interface ListingViewSwitcherProps {
  className?: string;
}

export function ListingViewSwitcher({ className }: ListingViewSwitcherProps) {
  const { view, setView, isNative } = useListingView();

  const options: { value: ListingView; label: string; Icon: typeof LayoutGrid }[] =
    isNative
      ? [
          { value: "single", label: "Single", Icon: Square },
          { value: "default", label: "Default", Icon: LayoutGrid },
          { value: "compact", label: "Compact", Icon: Grid3x3 },
        ]
      : [
          { value: "large", label: "Large", Icon: Rows3 },
          { value: "default", label: "Default", Icon: LayoutGrid },
          { value: "compact", label: "Compact", Icon: Grid3x3 },
        ];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-border bg-background p-0.5",
        className
      )}
      role="group"
      aria-label="Change card layout"
      data-testid="listing-view-switcher"
    >
      {options.map(({ value, label, Icon }) => {
        const active = view === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setView(value)}
            aria-label={label}
            aria-pressed={active}
            title={label}
            data-testid={`button-view-${value}`}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
              active
                ? "bg-orange-500 text-white shadow-sm"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}
