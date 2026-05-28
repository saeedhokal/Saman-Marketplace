import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useProducts } from "@/hooks/use-products";
import { useLanguage } from "@/hooks/use-language";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Car, Wrench, Loader2, ArrowLeft, SlidersHorizontal, ArrowUpDown, X, Check, ChevronsUpDown } from "lucide-react";
import { PullToRefresh } from "@/components/PullToRefresh";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ListingViewSwitcher } from "@/components/ListingViewSwitcher";
import dubaiNightSkyline from "@/assets/images/dubai-night-skyline.png";
import { DownloadAppButton, ActionsDropdown } from "@/components/WebChromeActions";
import { useListingView } from "@/hooks/use-listing-view";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Link } from "wouter";

type MainCategory = "automotive" | "spare-parts";
type SortOption = "newest" | "oldest" | "price-low" | "price-high";

interface CategoryFilters {
  search: string;
  activeCategory: MainCategory;
  activeSubCategory: string;
  activeModel: string;
  sortBy: SortOption;
  priceMin: string;
  priceMax: string;
  yearMin: string;
  yearMax: string;
  kmMin: string;
  kmMax: string;
  sellerType: string;
  condition: string;
}

let savedFilters: CategoryFilters | null = null;
let savedScrollY: number = 0;

export default function Categories() {
  const { t, isRTL } = useLanguage();
  const { density, gridClasses } = useListingView();

  const initState = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "spare-parts" || tab === "automotive") {
      savedFilters = null;
      savedScrollY = 0;
      return { activeCategory: tab as MainCategory };
    }
    if (savedFilters) return savedFilters;
    return {};
  }, []);

  const [search, setSearch] = useState(initState.search || "");
  const [subCatOpen, setSubCatOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MainCategory>(initState.activeCategory || "automotive");
  const [activeSubCategory, setActiveSubCategory] = useState(initState.activeSubCategory || "All");
  const [activeModel, setActiveModel] = useState(initState.activeModel || "All");
  const [sortBy, setSortBy] = useState<SortOption>(initState.sortBy || "newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceMin, setPriceMin] = useState(initState.priceMin || "");
  const [priceMax, setPriceMax] = useState(initState.priceMax || "");
  const [yearMin, setYearMin] = useState(initState.yearMin || "");
  const [yearMax, setYearMax] = useState(initState.yearMax || "");
  const [kmMin, setKmMin] = useState(initState.kmMin || "");
  const [kmMax, setKmMax] = useState(initState.kmMax || "");
  const [sellerType, setSellerType] = useState(initState.sellerType || "all");
  const [condition, setCondition] = useState(initState.condition || "all");

  useEffect(() => {
    savedFilters = {
      search, activeCategory, activeSubCategory, activeModel, sortBy,
      priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, sellerType, condition,
    };
  }, [search, activeCategory, activeSubCategory, activeModel, sortBy, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, sellerType, condition]);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => { savedScrollY = container.scrollTop; };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const getMainCategoryFilter = () => {
    if (activeCategory === "spare-parts") return "Spare Parts";
    if (activeCategory === "automotive") return "Automotive";
    return undefined;
  };

  const { data: products, isLoading, error, refetch } = useProducts({ 
    search: search || undefined, 
    mainCategory: getMainCategoryFilter(),
    subCategory: activeSubCategory !== "All" ? activeSubCategory : undefined,
  });

  const hasRestoredScroll = useRef(false);
  useEffect(() => {
    if (!isLoading && products && products.length > 0 && savedScrollY > 0 && !hasRestoredScroll.current) {
      hasRestoredScroll.current = true;
      const container = document.getElementById('main-scroll-container');
      if (!container) return;
      const tryRestore = (attempts: number) => {
        if (attempts <= 0) return;
        requestAnimationFrame(() => {
          if (container.scrollHeight > savedScrollY) {
            container.scrollTop = savedScrollY;
          } else {
            setTimeout(() => tryRestore(attempts - 1), 50);
          }
        });
      };
      tryRestore(20);
    }
  }, [isLoading, products]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const getSubcategories = () => {
    if (activeCategory === "spare-parts") {
      return ["All", ...SPARE_PARTS_SUBCATEGORIES];
    } else if (activeCategory === "automotive") {
      return ["All", ...AUTOMOTIVE_SUBCATEGORIES];
    }
    return [];
  };

  const handleCategoryChange = (category: MainCategory) => {
    setActiveCategory(category);
    setActiveSubCategory("All");
    setActiveModel("All");
    if (category === "spare-parts") {
      setSortBy("newest");
    }
  };

  const handleSubCategoryChange = (subCategory: string) => {
    setActiveSubCategory(subCategory);
    setActiveModel("All");
  };

  const getModelsForBrand = () => {
    if (activeCategory !== "automotive" || activeSubCategory === "All") {
      return [];
    }
    return CAR_MODELS[activeSubCategory] || [];
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeSubCategory !== "All") count++;
    if (activeModel !== "All") count++;
    if (priceMin || priceMax) count++;
    if (yearMin || yearMax) count++;
    if (kmMin || kmMax) count++;
    if (sellerType !== "all") count++;
    if (condition !== "all") count++;
    return count;
  }, [activeSubCategory, activeModel, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, sellerType, condition]);

  const clearAllFilters = () => {
    setActiveSubCategory("All");
    setActiveModel("All");
    setPriceMin("");
    setPriceMax("");
    setYearMin("");
    setYearMax("");
    setKmMin("");
    setKmMax("");
    setSellerType("all");
    setCondition("all");
  };

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest": return t('newest');
      case "oldest": return t('oldest');
      case "price-low": return t('priceUp');
      case "price-high": return t('priceDown');
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    if (activeCategory === "automotive" && activeModel !== "All" && activeSubCategory !== "All") {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(activeModel.toLowerCase())
      );
    }

    if (priceMin) {
      const minPrice = parseFloat(priceMin);
      filtered = filtered.filter(p => (p.price || 0) >= minPrice);
    }
    if (priceMax) {
      const maxPrice = parseFloat(priceMax);
      filtered = filtered.filter(p => (p.price || 0) <= maxPrice);
    }
    
    if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    return filtered;
  }, [products, activeModel, sortBy, activeCategory, activeSubCategory, priceMin, priceMax]);

  return (
    <PullToRefresh onRefresh={handleRefresh} className="relative min-h-screen bg-background">
      {/* Faint Dubai skyline backdrop behind header + search/tabs (dark mode only) */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none hidden dark:block overflow-hidden"
        style={{ height: '440px', zIndex: 0 }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${dubaiNightSkyline})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 60%',
            filter: 'blur(2px) saturate(1.05) brightness(0.6)',
            transform: 'scale(1.05)',
            WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.25) 85%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.25) 85%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div className="absolute inset-0 bg-black/35" />
      </div>

      <div className="sticky top-0 z-50 bg-background/70 dark:bg-transparent backdrop-blur-md border-b border-border/40 dark:border-white/5">
        <div className="container mx-auto px-4">
          <div className="relative flex items-center justify-center h-14">
            <button type="button" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = "/")} className={`absolute ${isRTL ? 'right-0' : 'left-0'} p-2 rounded-lg hover:bg-secondary transition-colors`} data-testid="button-back">
              <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <h1 className="font-semibold text-lg">{t('categories')}</h1>
          </div>
        </div>
      </div>

      <div className={`relative z-10 container mx-auto px-4 pt-4 ${isRTL ? 'text-right' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Search bar with embedded filter button */}
        <div className={`flex items-center border border-border bg-white dark:bg-white/[0.03] rounded-full ${isRTL ? 'pr-4 pl-1' : 'pl-4 pr-1'} py-1.5 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Search className={`h-5 w-5 text-foreground/70 shrink-0 ${isRTL ? 'ml-3' : 'mr-3'}`} />
          <Input
            type="text"
            placeholder={t('searchCategory')}
            className={`border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0 placeholder:text-muted-foreground placeholder:font-semibold flex-1 min-w-0 ${isRTL ? 'text-right' : ''}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
          <div className={`h-6 w-px bg-border/70 shrink-0 ${isRTL ? 'ml-2 mr-1' : 'mr-2 ml-1'}`} />
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="relative h-9 w-9 shrink-0 rounded-full flex items-center justify-center hover:bg-secondary transition-colors"
            data-testid="button-filter"
            aria-label="Filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-foreground/80" />
            {activeFiltersCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ backgroundColor: '#f97316', color: 'white' }}
              >
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Category tabs - joined segmented control with radial-glow active state */}
        <div
          className={cn(
            "flex mb-4 rounded-2xl border border-border bg-white dark:bg-white/[0.04] overflow-hidden p-0.5 gap-0.5",
            isRTL ? 'flex-row-reverse' : ''
          )}
        >
          <button
            onClick={() => handleCategoryChange("automotive")}
            data-testid="tab-automotive"
            className={cn(
              "flex-1 py-3 px-4 rounded-[14px] font-semibold text-base transition-all flex items-center justify-center gap-2 relative",
              activeCategory === "automotive"
                ? "text-orange-500 ring-1 ring-orange-500/70 shadow-[0_0_18px_-4px_rgba(249,115,22,0.55)]"
                : "text-foreground/80 dark:text-white/85 hover:bg-white/5",
              isRTL ? 'flex-row-reverse' : ''
            )}
            style={
              activeCategory === "automotive"
                ? { background: 'radial-gradient(120% 140% at 50% 50%, rgba(249,115,22,0.32) 0%, rgba(249,115,22,0.14) 45%, rgba(249,115,22,0.04) 100%)' }
                : undefined
            }
          >
            <Car className="h-5 w-5" />
            {t('automotive')}
          </button>

          <button
            onClick={() => handleCategoryChange("spare-parts")}
            data-testid="tab-spare-parts"
            className={cn(
              "flex-1 py-3 px-4 rounded-[14px] font-semibold text-base transition-all flex items-center justify-center gap-2 relative",
              activeCategory === "spare-parts"
                ? "text-orange-500 ring-1 ring-orange-500/70 shadow-[0_0_18px_-4px_rgba(249,115,22,0.55)]"
                : "text-foreground/80 dark:text-white/85 hover:bg-white/5",
              isRTL ? 'flex-row-reverse' : ''
            )}
            style={
              activeCategory === "spare-parts"
                ? { background: 'radial-gradient(120% 140% at 50% 50%, rgba(249,115,22,0.32) 0%, rgba(249,115,22,0.14) 45%, rgba(249,115,22,0.04) 100%)' }
                : undefined
            }
          >
            <Wrench className="h-5 w-5" />
            {t('spareParts')}
          </button>
        </div>

        <div className={`mb-3 flex gap-2 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Popover open={subCatOpen} onOpenChange={setSubCatOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={subCatOpen}
                className="flex-1 justify-between font-semibold text-foreground h-9"
                data-testid="select-category"
              >
                <span className="truncate">
                  {activeSubCategory === "All"
                    ? (activeCategory === "automotive" ? t('allBrands') : t('allCategories'))
                    : activeSubCategory}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
              <Command>
                <CommandInput placeholder={t('searchCategoryPlaceholder')} />
                <CommandList>
                  <CommandEmpty>{t('noCategoryFound')}</CommandEmpty>
                  <CommandGroup>
                    {getSubcategories().map((cat) => {
                      const label = cat === "All"
                        ? (activeCategory === "automotive" ? t('allBrands') : t('allCategories'))
                        : cat;
                      return (
                        <CommandItem
                          key={cat}
                          value={label}
                          onSelect={() => {
                            handleSubCategoryChange(cat);
                            setSubCatOpen(false);
                          }}
                          className="cursor-pointer"
                          data-testid={`option-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {label}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              activeSubCategory === cat ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {activeCategory === "automotive" && activeSubCategory !== "All" && getModelsForBrand().length > 0 && (
            <Popover open={modelOpen} onOpenChange={setModelOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={modelOpen}
                  className="flex-1 justify-between font-semibold text-foreground h-9"
                  data-testid="select-model"
                >
                  <span className="truncate">
                    {activeModel === "All" ? t('allModels') : activeModel}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start">
                <Command>
                  <CommandInput placeholder={t('searchCategoryPlaceholder')} />
                  <CommandList>
                    <CommandEmpty>{t('noCategoryFound')}</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value={t('allModels')}
                        onSelect={() => {
                          setActiveModel("All");
                          setModelOpen(false);
                        }}
                        className="cursor-pointer"
                      >
                        {t('allModels')}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            activeModel === "All" ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                      {getModelsForBrand().map((model) => (
                        <CommandItem
                          key={model}
                          value={model}
                          onSelect={() => {
                            setActiveModel(model);
                            setModelOpen(false);
                          }}
                          className="cursor-pointer"
                          data-testid={`option-model-${model.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {model}
                          <Check
                            className={cn(
                              "ml-auto h-4 w-4",
                              activeModel === model ? "opacity-100" : "opacity-0"
                            )}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 border border-border rounded-md" data-testid="button-sort-inline">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSortBy("newest")} className="cursor-pointer">Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")} className="cursor-pointer">Oldest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-low")} className="cursor-pointer">Price: Low to High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-high")} className="cursor-pointer">Price: High to Low</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* View switcher (card layout choices) — sits directly under All Brands row */}
        <div className={`flex items-center mb-4 ${isRTL ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          <ListingViewSwitcher />
        </div>

        <div className="flex items-center gap-2 mb-4 empty:mb-0">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetContent side="bottom" className="h-auto max-h-[70vh] rounded-t-2xl">
              <SheetHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-base font-semibold">Filters</SheetTitle>
                  {activeFiltersCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-orange-500 h-7 text-xs">
                      Clear all
                    </Button>
                  )}
                </div>
              </SheetHeader>
              <div className="space-y-4 overflow-y-auto pb-4 max-h-[55vh]">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Brand</label>
                    <Select value={activeSubCategory} onValueChange={handleSubCategoryChange}>
                      <SelectTrigger className="h-9 text-sm" data-testid="filter-select-category">
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSubcategories().map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat === "All" ? "All" : cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {activeCategory === "automotive" && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Model</label>
                      <Select value={activeModel} onValueChange={setActiveModel} disabled={activeSubCategory === "All"}>
                        <SelectTrigger className="h-9 text-sm" data-testid="filter-select-model">
                          <SelectValue placeholder="All" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All</SelectItem>
                          {getModelsForBrand().map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Price (AED)</label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      className="flex-1 h-9 text-sm"
                      data-testid="input-price-min"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      className="flex-1 h-9 text-sm"
                      data-testid="input-price-max"
                    />
                  </div>
                </div>

                {activeCategory === "automotive" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Year</label>
                        <div className="flex gap-1 items-center">
                          <Input
                            type="number"
                            placeholder="From"
                            value={yearMin}
                            onChange={(e) => setYearMin(e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                          <span className="text-muted-foreground text-xs">-</span>
                          <Input
                            type="number"
                            placeholder="To"
                            value={yearMax}
                            onChange={(e) => setYearMax(e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Kilometers</label>
                        <div className="flex gap-1 items-center">
                          <Input
                            type="number"
                            placeholder="Min"
                            value={kmMin}
                            onChange={(e) => setKmMin(e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                          <span className="text-muted-foreground text-xs">-</span>
                          <Input
                            type="number"
                            placeholder="Max"
                            value={kmMax}
                            onChange={(e) => setKmMax(e.target.value)}
                            className="flex-1 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Seller Type</label>
                        <Select value={sellerType} onValueChange={setSellerType}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="dealer">Dealer</SelectItem>
                            <SelectItem value="private">Private</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Condition</label>
                        <Select value={condition} onValueChange={setCondition}>
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="used">Used</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </>
                )}

                <Button 
                  className="w-full h-10 text-sm font-medium" 
                  style={{ backgroundColor: '#f97316' }}
                  onClick={() => setFilterOpen(false)}
                  data-testid="button-apply-filters"
                >
                  Show Results
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {activeFiltersCount > 0 && (
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {activeSubCategory !== "All" && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}
                >
                  {activeSubCategory}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => { setActiveSubCategory("All"); setActiveModel("All"); }} />
                </span>
              )}
              {activeModel !== "All" && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                  style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}
                >
                  {activeModel}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => setActiveModel("All")} />
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center justify-end gap-2 mb-3 ${isRTL ? 'flex-row-reverse justify-start' : ''}`}>
          <DownloadAppButton variant="compact" />
          <ActionsDropdown />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive">Failed to load products</p>
          </div>
        ) : filteredAndSortedProducts.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeCategory}-${activeSubCategory}-${activeModel}-${sortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={gridClasses}
            >
              {filteredAndSortedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <ProductCard 
                    product={product} 
                    sellerImageUrl={(product as any).sellerProfileImageUrl}
                    sellerFirstName={(product as any).sellerFirstName}
                    sellerLastName={(product as any).sellerLastName}
                    sellerDisplayName={(product as any).sellerDisplayName}
                    showDate
                    density={density}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
              {activeCategory === "automotive" ? (
                <Car className="h-8 w-8 text-accent/50" />
              ) : (
                <Wrench className="h-8 w-8 text-accent/50" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No listings yet</h3>
            <p className="text-muted-foreground text-sm">
              Be the first to list in this category
            </p>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
