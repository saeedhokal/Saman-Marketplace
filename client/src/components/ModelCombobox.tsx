import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ModelComboboxProps {
  models: string[];
  value: string;
  onValueChange: (value: string) => void;
  emptyValue?: string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  disabled?: boolean;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

export function ModelCombobox({
  models,
  value,
  onValueChange,
  emptyValue = "",
  emptyLabel = "Select Model",
  searchPlaceholder = "Search models...",
  noResultsLabel = "No model found",
  disabled = false,
  className,
  testId = "select-model",
  ariaLabel,
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = value && value !== emptyValue ? value : emptyLabel;

  const selectValue = (nextValue: string) => {
    onValueChange(nextValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn("w-full justify-between font-normal", className)}
          data-testid={testId}
        >
          <span className={cn("truncate", value === emptyValue && "text-muted-foreground")}>
            {selectedLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl"
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[50vh]">
            <CommandEmpty>{noResultsLabel}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value={emptyLabel}
                onSelect={() => selectValue(emptyValue)}
                className="cursor-pointer"
              >
                {emptyLabel}
                <Check
                  className={cn(
                    "ml-auto h-4 w-4",
                    value === emptyValue ? "opacity-100" : "opacity-0",
                  )}
                />
              </CommandItem>
              {models.map((model) => (
                <CommandItem
                  key={model}
                  value={model}
                  onSelect={() => selectValue(model)}
                  className="cursor-pointer"
                  data-testid={`option-model-${model.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {model}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === model ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}