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
import { useLanguage } from "@/hooks/use-language";

interface CategoryComboboxProps {
  mainCategory: string;
  subCategory: string;
  onMainCategoryChange: (value: string) => void;
  onSubCategoryChange: (value: string) => void;
  isPosting?: boolean;
}

export function CategoryCombobox({
  mainCategory,
  subCategory,
  onMainCategoryChange,
  onSubCategoryChange,
  isPosting = false,
}: CategoryComboboxProps) {
  const [mainOpen, setMainOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const { t, isRTL, language } = useLanguage();

  const getSubcategories = () => {
    if (mainCategory === "Spare Parts") {
      return [...SPARE_PARTS_SUBCATEGORIES];
    } else if (mainCategory === "Automotive") {
      return [...AUTOMOTIVE_SUBCATEGORIES];
    }
    return [];
  };

  const subcategories = getSubcategories();

  const getCategoryLabel = (cat: string) => {
    if (cat === "Spare Parts") return t("spareParts");
    if (cat === "Automotive") {
      return isPosting && language === 'ar' ? "سيارات، دراجات" : t("automotive");
    }
    return cat;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {t("mainCategory")}
        </label>
        <Popover open={mainOpen} onOpenChange={setMainOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={mainOpen}
              className={cn(
                "w-full h-14 justify-between font-medium rounded-xl border-2 transition-all",
                mainCategory === "Automotive" && "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
                mainCategory === "Spare Parts" && "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
                !mainCategory && "border-dashed border-muted-foreground/30 hover:border-orange-300"
              )}
              data-testid="select-main-category"
            >
              {mainCategory ? (
                <span className="flex items-center gap-3">
                  <span 
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ backgroundColor: '#f97316' }}
                  >
                    {mainCategory === "Automotive" ? (
                      <Car className="h-4 w-4 text-white" />
                    ) : (
                      <Wrench className="h-4 w-4 text-white" />
                    )}
                  </span>
                  <span className="text-orange-900 dark:text-orange-100 font-semibold">{getCategoryLabel(mainCategory)}</span>
                </span>
              ) : (
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted">
                    <Car className="h-4 w-4" />
                  </span>
                  {t("selectCategoryPlaceholder")}
                </span>
              )}
              <ChevronsUpDown className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4 shrink-0 opacity-50`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-xl" align="start">
            <Command>
              <CommandInput placeholder={t("searchCategoryPlaceholder")} className="h-10" />
              <CommandList>
                <CommandEmpty>{t("noCategoryFound")}</CommandEmpty>
                <CommandGroup className="p-1">
                  {MAIN_CATEGORIES.map((cat) => (
                    <CommandItem
                      key={cat}
                      value={cat}
                      onSelect={() => {
                        onMainCategoryChange(cat);
                        onSubCategoryChange("");
                        setMainOpen(false);
                      }}
                      className="cursor-pointer rounded-lg p-3 mb-1"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className="flex items-center justify-center w-8 h-8 rounded-lg"
                          style={{ backgroundColor: mainCategory === cat ? '#f97316' : '#fed7aa' }}
                        >
                          {cat === "Automotive" ? (
                            <Car className="h-4 w-4" style={{ color: mainCategory === cat ? 'white' : '#9a3412' }} />
                          ) : (
                            <Wrench className="h-4 w-4" style={{ color: mainCategory === cat ? 'white' : '#9a3412' }} />
                          )}
                        </span>
                        <span className="font-medium">{getCategoryLabel(cat)}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          mainCategory === cat ? "opacity-100 text-orange-500" : "opacity-0"
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
          {t("sparePartsDesc")}
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {t("subcategory")}
        </label>
        <Popover open={subOpen} onOpenChange={setSubOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={subOpen}
              className={cn(
                "w-full h-14 justify-between font-medium rounded-xl border-2 transition-all",
                subCategory && "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
                !subCategory && mainCategory && "border-dashed border-muted-foreground/30 hover:border-orange-300",
                !mainCategory && "border-muted opacity-60"
              )}
              disabled={!mainCategory}
              data-testid="select-sub-category"
            >
              {subCategory ? (
                <span className="flex items-center gap-3">
                  <span 
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: '#f97316', color: 'white' }}
                  >
                    {subCategory.charAt(0)}
                  </span>
                  <span className="text-orange-900 dark:text-orange-100 font-semibold">{subCategory}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {mainCategory ? t("searchOrSelect") : t("selectMainFirst")}
                </span>
              )}
              <ChevronsUpDown className={`${isRTL ? 'mr-2' : 'ml-2'} h-4 w-4 shrink-0 opacity-50`} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 rounded-xl" align="start">
            <Command>
              <CommandInput placeholder={t("searchSubCategory")} />
              <CommandList>
                <CommandEmpty>{t("noSubCategoryFound")}</CommandEmpty>
                {mainCategory === "Spare Parts" && (
                  <>
                    <CommandGroup heading={t("partTypes")}>
                      {["Universal", "Rims", "Tires", "Turbos & Superchargers", "Lights", "Other"]
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
                    <CommandGroup heading={t("manufacturers")}>
                      {subcategories
                        .filter(cat => !["Universal", "Rims", "Tires", "Turbos & Superchargers", "Lights", "Other"].includes(cat))
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
                  </>
                )}
                {mainCategory === "Automotive" && (
                  <>
                    <CommandGroup heading={t("brands")}>
                      {subcategories
                        .filter(cat => !["Motorcycles", "Other"].includes(cat))
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
                    <CommandGroup heading={t("vehicleTypes")}>
                      {["Motorcycles", "Other"]
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
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}