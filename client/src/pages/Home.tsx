import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Car, Wrench, Loader2, SlidersHorizontal, ArrowUpDown, X, ShieldCheck, MapPin, ChevronRight, Sparkles } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ListingViewSwitcher } from "@/components/ListingViewSwitcher";
import { ModelCombobox } from "@/components/ModelCombobox";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/hooks/use-language";

type MainCategory = "automotive" | "spare-parts";
type SortOption = "newest" | "oldest" | "price-low" | "price-high";

export default function Home() {
  const { isRTL } = useLanguage();
  const { density, gridClasses } = useListingView();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MainCategory>("automotive");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [activeModel, setActiveModel] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [kmMin, setKmMin] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [sellerType, setSellerType] = useState("all");
  const [condition, setCondition] = useState("all");
  
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

  const handleRefresh = useCallback(async () => {
    await refetch();
    await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
  }, [refetch]);

  const getSubcategories = () => {
    if (activeCategory === "spare-parts") {
      return ["All", ...SPARE_PARTS_SUBCATEGORIES];
    } else if (activeCategory === "automotive") {
      return ["All", ...AUTOMOTIVE_SUBCATEGORIES];
    }
    return [];
  };

  const getModelsForBrand = () => {
    if (activeCategory !== "automotive" || activeSubCategory === "All") {
      return [];
    }
    return CAR_MODELS[activeSubCategory] || [];
  };

  const handleCategoryChange = (category: MainCategory) => {
    setActiveCategory(category);
    setActiveSubCategory("All");
    setActiveModel("All");
  };

  const handleSubCategoryChange = (value: string) => {
    setActiveSubCategory(value);
    setActiveModel("All");
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

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    if (activeCategory === "automotive" && activeModel !== "All" && activeSubCategory !== "All") {
      const normalizedModel = activeModel.toLowerCase();
      filtered = filtered.filter(p =>
        p.model?.toLowerCase() === normalizedModel ||
        p.title.toLowerCase().includes(normalizedModel)
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

  const getSortLabel = () => {
    switch (sortBy) {
      case "newest": return "Newest";
      case "oldest": return "Oldest";
      case "price-low": return "Price ↑";
      case "price-high": return "Price ↓";
    }
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen bg-background">
      <section className="relative overflow-hidden border-b border-border/70 bg-[#f5f1ea] dark:bg-[#17181a]">
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="container relative mx-auto px-4 pb-8 pt-7 lg:pb-10 lg:pt-10">
          <div className="mb-7 flex items-center justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-600 dark:text-orange-400">SAMAN / UAE MARKETPLACE</p>
              <h1 className="font-display text-2xl font-black tracking-tight sm:text-4xl">Find your next move.</h1>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex">
              <ShieldCheck className="h-4 w-4 text-orange-500" /> Trusted local listings
            </div>
          </div>
          <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-border/80 bg-background p-2 shadow-[0_18px_60px_-30px_rgba(20,24,30,.5)]">
            <div className="flex items-center gap-3 rounded-[1.1rem] border border-border/70 bg-secondary/40 px-4 py-2.5">
              <Search className="h-5 w-5 shrink-0 text-orange-500" />
              <Input type="text" placeholder={isRTL ? "ابحث عن سيارات، قطع غيار والمزيد..." : "Search cars, parts and more"} className="h-9 border-0 bg-transparent p-0 text-base shadow-none focus-visible:ring-0" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search" />
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">Shortcut</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button onClick={() => handleCategoryChange("automotive")} data-testid="tab-automotive" className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all ${activeCategory === "automotive" ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20" : "border-border bg-background hover:border-orange-300"}`}>
                <Car className="h-5 w-5" /><span><strong className="block text-sm">{isRTL ? "سيارات ومركبات" : "Automotive"}</strong><small className={activeCategory === "automotive" ? "text-white/75" : "text-muted-foreground"}>{isRTL ? "سيارات، دراجات والمزيد" : "Cars, bikes & more"}</small></span>
              </button>
              <button onClick={() => handleCategoryChange("spare-parts")} data-testid="tab-spare-parts" className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-start transition-all ${activeCategory === "spare-parts" ? "border-orange-500 bg-orange-500 text-white shadow-md shadow-orange-500/20" : "border-border bg-background hover:border-orange-300"}`}>
                <Wrench className="h-5 w-5" /><span><strong className="block text-sm">{isRTL ? "قطع الغيار" : "Spare Parts"}</strong><small className={activeCategory === "spare-parts" ? "text-white/75" : "text-muted-foreground"}>{isRTL ? "أصلية وبديلة" : "Genuine & aftermarket"}</small></span>
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Select value={activeSubCategory} onValueChange={handleSubCategoryChange}>
                <SelectTrigger className="h-11 border-border/80 bg-background font-semibold" data-testid="select-category"><SelectValue placeholder={activeCategory === "automotive" ? "All Brands" : "All Categories"} /></SelectTrigger>
                <SelectContent>{getSubcategories().map((cat) => <SelectItem key={cat} value={cat} data-testid={`option-${cat.toLowerCase().replace(/\s+/g, '-')}`}>{cat === "All" ? (activeCategory === "automotive" ? "All Brands" : "All Categories") : cat}</SelectItem>)}</SelectContent>
              </Select>
              {activeCategory === "automotive" && activeSubCategory !== "All" && getModelsForBrand().length > 0 ? <ModelCombobox models={getModelsForBrand()} value={activeModel} onValueChange={setActiveModel} emptyValue="All" emptyLabel="All Models" className="h-11" /> : <div className="hidden items-center gap-2 rounded-lg border border-dashed border-border px-3 text-xs text-muted-foreground sm:flex"><MapPin className="h-4 w-4 text-orange-500" /> Across the UAE</div>}
            </div>
          </div>
          <div className="mx-auto mt-5 flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Browse popular</span>
            {(activeCategory === "automotive" ? AUTOMOTIVE_SUBCATEGORIES.slice(0, 5) : SPARE_PARTS_SUBCATEGORIES.slice(0, 5)).map((cat) => <button key={cat} onClick={() => handleSubCategoryChange(cat)} className="transition-colors hover:text-orange-600">{cat}</button>)}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pt-6">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_250px]">
          <div className="min-w-0">

        <div className="flex items-center gap-2 pb-4">
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative h-8 w-8"
                data-testid="button-filter"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span 
                    className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ backgroundColor: '#f97316', color: 'white' }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
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
                      <ModelCombobox
                        models={getModelsForBrand()}
                        value={activeModel}
                        onValueChange={setActiveModel}
                        emptyValue="All"
                        emptyLabel="All"
                        disabled={activeSubCategory === "All"}
                        className="h-9 text-sm"
                        testId="filter-select-model"
                      />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-sort">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => setSortBy("newest")} className="cursor-pointer">
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")} className="cursor-pointer">
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-low")} className="cursor-pointer">
                Price: Low to High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("price-high")} className="cursor-pointer">
                Price: High to Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
      </div>

      <main className="mx-auto max-w-5xl px-0 pb-8">
        <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/70 pb-3">
          <div>
            <p className="text-sm font-bold">{activeCategory === "automotive" ? "Cars & vehicles" : "Parts marketplace"}</p>
            <p className="text-xs text-muted-foreground">{filteredAndSortedProducts.length} listings available</p>
          </div>
          <div className="flex items-center gap-2">
            <ListingViewSwitcher />
            <DownloadAppButton variant="compact" />
            <ActionsDropdown />
          </div>
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
          <div className={gridClasses}>
            {filteredAndSortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                sellerImageUrl={(product as any).sellerProfileImageUrl}
                sellerFirstName={(product as any).sellerFirstName}
                sellerLastName={(product as any).sellerLastName}
                sellerDisplayName={(product as any).sellerDisplayName}
                showDate
                density={density}
              />
            ))}
          </div>
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
      </main>
          </div>
          <aside className="hidden space-y-4 lg:block">
            <div className="sticky top-4 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-orange-500/25 bg-orange-500 p-5 text-white shadow-lg shadow-orange-500/10">
                <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-xl bg-white/15"><Sparkles className="h-4 w-4" /></div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[.18em] text-white/70">Saman on mobile</p>
                <h2 className="font-display text-xl font-black leading-tight">Your market, wherever you are.</h2>
                <p className="mt-2 text-xs leading-relaxed text-white/80">Save searches, message sellers and browse new listings faster.</p>
                <div className="mt-5"><DownloadAppButton className="w-full bg-white text-orange-600 hover:bg-orange-50" /></div>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-secondary p-2"><ShieldCheck className="h-4 w-4 text-orange-500" /></div>
                  <div><p className="text-sm font-bold">A clearer way to buy</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Compare real listings from sellers across the UAE.</p></div>
                </div>
                <button onClick={() => document.querySelector('[data-testid="input-search"]')?.scrollIntoView({ behavior: "smooth" })} className="mt-4 flex w-full items-center justify-between border-t border-border pt-3 text-xs font-semibold text-orange-600">Start searching <ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
          </aside>
        </div>
    </PullToRefresh>
  );
}
