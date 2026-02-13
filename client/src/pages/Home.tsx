import { useState, useMemo, useCallback } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Car, Wrench, Loader2, SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { PullToRefresh } from "@/components/PullToRefresh";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS } from "@shared/schema";
import { Button } from "@/components/ui/button";
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

type MainCategory = "automotive" | "spare-parts";
type SortOption = "newest" | "oldest" | "price-low" | "price-high";

export default function Home() {
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
      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center glass-card rounded-full px-4 py-2 mb-4">
          <Search className="h-5 w-5 text-foreground/70 mr-3" />
          <Input
            type="text"
            placeholder="Search for category..."
            className="border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0 placeholder:text-muted-foreground placeholder:font-semibold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        <div className="flex gap-3 mb-3">
          <button
            onClick={() => handleCategoryChange("automotive")}
            data-testid="tab-automotive"
            className={`flex-1 py-4 px-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 border-2 ${
              activeCategory === "automotive" 
                ? "border-blue-300 dark:border-slate-500/60 text-white shadow-lg" 
                : "bg-gray-100 dark:bg-slate-800/30 border-gray-200 dark:border-slate-600/30 text-gray-500 dark:text-slate-400"
            }`}
            style={activeCategory === "automotive" ? { background: 'linear-gradient(135deg, #1e3a5f 0%, #0f2744 50%, #1a3550 100%)' } : {}}
          >
            <Car className="h-5 w-5" />
            Automotive
          </button>
          
          <button
            onClick={() => handleCategoryChange("spare-parts")}
            data-testid="tab-spare-parts"
            className={`flex-1 py-4 px-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2 border-2 ${
              activeCategory === "spare-parts" 
                ? "border-orange-400/60 text-white shadow-lg shadow-orange-500/30" 
                : "bg-gray-100 dark:bg-slate-800/30 border-gray-200 dark:border-slate-600/30 text-gray-500 dark:text-slate-400"
            }`}
            style={activeCategory === "spare-parts" ? { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #fb923c 100%)' } : {}}
          >
            <Wrench className="h-5 w-5" />
            Spare Parts
          </button>
        </div>

        <div className="pb-3 flex gap-2">
          <Select value={activeSubCategory} onValueChange={handleSubCategoryChange}>
            <SelectTrigger className="flex-1 font-semibold text-foreground" data-testid="select-category">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategories().map((cat) => (
                <SelectItem key={cat} value={cat} data-testid={`option-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  {cat === "All" ? (activeCategory === "automotive" ? "All Brands" : "All Categories") : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {activeCategory === "automotive" && activeSubCategory !== "All" && getModelsForBrand().length > 0 && (
            <Select value={activeModel} onValueChange={setActiveModel}>
              <SelectTrigger className="flex-1 font-semibold text-foreground" data-testid="select-model">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Models</SelectItem>
                {getModelsForBrand().map((model) => (
                  <SelectItem key={model} value={model} data-testid={`option-model-${model.toLowerCase().replace(/\s+/g, '-')}`}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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

      <main className="container mx-auto px-4 pb-8">
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
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
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
                    showDate
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
      </main>
    </PullToRefresh>
  );
}
