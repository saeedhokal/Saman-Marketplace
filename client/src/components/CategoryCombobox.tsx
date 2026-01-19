import { useState } from "react";
import { Check, ChevronsUpDown, Search, Car, Wrench } from "lucide-react";
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
import { MAIN_CATEGORIES, SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";

interface CategoryComboboxProps {
  mainCategory: string;
  subCategory: string;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
}

export function CategoryCombobox({
  mainCategory,
  subCategory,
  onMainCategoryChange,
  onSubCategoryChange,
}: CategoryComboboxProps) {
  const [mainOpen, setMainOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);

  const getSubcategories = () => {
    if (mainCategory === "Spare Parts") {
      return [...SPARE_PARTS_SUBCATEGORIES];
    } else if (mainCategory === "Automotive") {
      return [...AUTOMOTIVE_SUBCATEGORIES];
    }
    return [];
  };

  const subcategories = getSubcategories();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Main Category
        </label>
        <Popover open={mainOpen} onOpenChange={setMainOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={mainOpen}
              className="w-full h-12 justify-between font-normal"
              data-testid="select-main-category"
            >
              {mainCategory ? (
                <span className="flex items-center gap-2">
                  {mainCategory === "Automotive" ? (
                    <Car className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  )}
                  {mainCategory}
                </span>
              ) : (
                <span className="text-muted-foreground">Select category...</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search category..." />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {MAIN_CATEGORIES.map((cat) => (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => {
                        onMainCategoryChange(cat);
                        onSubCategoryChange("");
                        setMainOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {cat === "Automotive" ? (
                          <Car className="h-4 w-4" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                        {cat}
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          mainCategory === cat ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <p className="text-sm text-muted-foreground">
          Spare Parts for car parts, Automotive for vehicles
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Sub-Category
        </label>
        <Popover open={subOpen} onOpenChange={setSubOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subOpen}
              className="w-full h-12 justify-between font-normal"
              disabled={!mainCategory}
              data-testid="select-sub-category"
            >
              {subCategory ? (
                subCategory
              ) : (
                <span className="text-muted-foreground">
                  {mainCategory ? "Search or select..." : "Select main category first"}
                </span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search sub-category..." />
              <CommandList>
                <CommandEmpty>No sub-category found.</CommandEmpty>
                <CommandGroup heading="Brands">
                  {subcategories
                    .filter(cat => !["Turbos & Superchargers", "Tires", "Brakes", "Suspension", "Exhaust", "Engine Parts", "Transmission", "Electrical", "Body Parts", "Interior", "Lights", "Offroad", "Motorcycles", "Other"].includes(cat))
                    .map((cat) => (
                      <CommandItem
                        key={cat}
                        value={cat}
                        onSelect={() => {
                          onSubCategoryChange(cat);
                          setSubOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        {cat}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            subCategory === cat ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                </CommandGroup>
                {mainCategory === "Spare Parts" && (
                  <CommandGroup heading="Part Types">
                    {["Turbos & Superchargers", "Tires", "Brakes", "Suspension", "Exhaust", "Engine Parts", "Transmission", "Electrical", "Body Parts", "Interior", "Lights", "Other"]
                      .filter(cat => subcategories.includes(cat as any))
                      .map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={() => {
                            onSubCategoryChange(cat);
                            setSubOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {cat}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              subCategory === cat ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
                {mainCategory === "Automotive" && (
                  <CommandGroup heading="Vehicle Types">
                    {["Offroad", "Motorcycles", "Other"]
                      .filter(cat => subcategories.includes(cat as any))
                      .map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={() => {
                            onSubCategoryChange(cat);
                            setSubOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {cat}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              subCategory === cat ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
