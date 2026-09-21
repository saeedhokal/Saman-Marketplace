import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { getSavedScroll, setSavedScroll } from "@/lib/scrollMemory";
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
import { ModelCombobox } from "@/components/ModelCombobox";
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
import { useSearch } from "wouter";
import { DesktopFilterSidebar } from "@/components/DesktopFilterSidebar";
import { Capacitor } from "@capacitor/core";
import { useDesktopTheme } from "@/hooks/use-desktop-theme";
import dubaiNightSportsCar from "@/assets/images/search-dubai-panorama.webp";

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
  condition: string;
}

let savedFilters: CategoryFilters | null = null;
const SCROLL_KEY = "categories";

export default function Categories() {
  const { t, isRTL } = useLanguage();
  const { theme } = useDesktopTheme();
  // Wouter's pathname location does not change for query-only navigation.
  // useSearch subscribes to pushState/replaceState/popstate separately.
  const urlSearch = useSearch();
  const { density, gridClasses } = useListingView();

  const initState = useMemo((): Partial<CategoryFilters> => {
    const params = new URLSearchParams(urlSearch);
    const tab = params.get("tab");
    const hasTab = tab === "spare-parts" || tab === "automotive";
    const hasUrlFilters = ["tab", "subCategory", "brand", "model", "search", "sort",
      "priceMin", "priceMax", "yearMin", "yearMax", "kmMin", "kmMax", "condition"]
      .some((key) => params.has(key));

    if (hasUrlFilters) {
      // A tab URL is a new browse context and should not inherit the previous
      // tab's selections. Query-only links (for example ?search=brake) are
      // patches over the saved context, so opening/back-navigation does not
      // erase filters that were restored from the previous browse session.
      const base: Partial<CategoryFilters> = hasTab ? {} : (savedFilters || {});
      const category = (hasTab ? tab : base.activeCategory) || "automotive";
      const validSubs: readonly string[] =
        category === "spare-parts" ? SPARE_PARTS_SUBCATEGORIES : AUTOMOTIVE_SUBCATEGORIES;
      const subCatParam = params.has("subCategory") || params.has("brand")
        ? (params.get("subCategory") ?? params.get("brand") ?? "")
        : undefined;
      const activeSubCategory = subCatParam !== undefined
        ? (validSubs.includes(subCatParam) ? subCatParam : "All")
        : (base.activeSubCategory || "All");
      const rawModel = params.has("model") ? (params.get("model") || "") : undefined;
      const validModels = category === "automotive" && activeSubCategory !== "All"
        ? (CAR_MODELS[activeSubCategory] || [])
        : [];
      const activeModel = rawModel !== undefined
        ? (validModels.includes(rawModel) ? rawModel : "All")
        : (base.activeModel || "All");
      const validNumber = (key: string, fallback = "") => {
        if (!params.has(key)) return fallback;
        const value = params.get(key) || "";
        return /^\d+(?:\.\d+)?$/.test(value) ? value : "";
      };
      const validCondition = (value: string | null, fallback = "all") =>
        value === null ? fallback : (["all", "new", "used", "refurbished"].includes(value) ? value : "all");
      const validSort = (value: string | null, fallback: SortOption = "newest"): SortOption =>
        value === null ? fallback : (["newest", "oldest", "price-low", "price-high"].includes(value)
          ? value as SortOption
          : "newest");
      const initSearch = params.has("search") ? (params.get("search") || "").trim() : (base.search || "");

      if (hasTab) {
        savedFilters = null;
        setSavedScroll(SCROLL_KEY, 0);
      }

      return {
        ...base,
        activeCategory: category as MainCategory,
        activeSubCategory,
        activeModel,
        search: initSearch,
        sortBy: validSort(params.get("sort"), base.sortBy),
        priceMin: validNumber("priceMin", base.priceMin),
        priceMax: validNumber("priceMax", base.priceMax),
        yearMin: validNumber("yearMin", base.yearMin),
        yearMax: validNumber("yearMax", base.yearMax),
        kmMin: validNumber("kmMin", base.kmMin),
        kmMax: validNumber("kmMax", base.kmMax),
        condition: validCondition(params.has("condition") ? params.get("condition") : null, base.condition),
      };
    }
    if (savedFilters) return savedFilters;
    return {};
  }, [urlSearch]);
  const pendingNormalizedSearch = useRef<string | null>(null);

  /*
   * Keep legacy brand links readable while making subCategory canonical. This
   * is deliberately an effect rather than a render-time history mutation so
   * useSearch receives the resulting replaceState update.
   */
  useEffect(() => {
    const params = new URLSearchParams(urlSearch);
    if (!params.has("brand")) return;
    const brand = params.get("brand");
    params.delete("brand");
    if (!params.has("subCategory") && brand) params.set("subCategory", brand);
    const normalizedSearch = params.toString();
    pendingNormalizedSearch.current = normalizedSearch;
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (normalizedSearch ? `?${normalizedSearch}` : ""),
    );
  }, [urlSearch]);

  const [search, setSearch] = useState(initState.search || "");
  const [subCatOpen, setSubCatOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<MainCategory>(initState.activeCategory || "automotive");
  const [activeSubCategory, setActiveSubCategory] = useState(initState.activeSubCategory || "All");
  const [activeModel, setActiveModel] = useState(initState.activeModel || "All");
  const [sortBy, setSortBy] = useState<SortOption>(initState.sortBy || "newest");
  const [filterOpen, setFilterOpen] = useState(
    () => !Capacitor.isNativePlatform() && window.innerWidth >= 1024,
  );
  const [priceMin, setPriceMin] = useState(initState.priceMin || "");
  const [priceMax, setPriceMax] = useState(initState.priceMax || "");
  const [yearMin, setYearMin] = useState(initState.yearMin || "");
  const [yearMax, setYearMax] = useState(initState.yearMax || "");
  const [kmMin, setKmMin] = useState(initState.kmMin || "");
  const [kmMax, setKmMax] = useState(initState.kmMax || "");
  const [condition, setCondition] = useState(initState.condition || "all");
  const [isDesktopWeb, setIsDesktopWeb] = useState(() => !Capacitor.isNativePlatform() && window.innerWidth >= 1024);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const update = () => setIsDesktopWeb(window.innerWidth >= 1024);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /*
   * Apply query-only navigations while Categories stays mounted. A pathname
   * location effect is insufficient here because Wouter intentionally tracks
   * the search string separately.
   */
  const previousSearch = useRef(urlSearch);
  useEffect(() => {
    if (previousSearch.current === urlSearch) return;
    previousSearch.current = urlSearch;
    if (pendingNormalizedSearch.current === urlSearch) {
      pendingNormalizedSearch.current = null;
      return;
    }
    const params = new URLSearchParams(urlSearch);
    const tab = params.get("tab");
    const hasTab = tab === "spare-parts" || tab === "automotive";
    const knownKey = ["tab", "subCategory", "brand", "model", "search", "sort",
      "priceMin", "priceMax", "yearMin", "yearMax", "kmMin", "kmMax", "condition"]
      .some((key) => params.has(key));
    if (!knownKey) return;

    const category = (hasTab ? tab : activeCategory) as MainCategory;
    const validSubs: readonly string[] =
      category === "spare-parts" ? SPARE_PARTS_SUBCATEGORIES : AUTOMOTIVE_SUBCATEGORIES;
    let nextSub = "All";
    if (hasTab) setActiveCategory(category);
    if (params.has("subCategory") || params.has("brand")) {
      const rawSub = params.get("subCategory") ?? params.get("brand") ?? "";
      nextSub = validSubs.includes(rawSub) ? rawSub : "All";
    }
    setActiveSubCategory(nextSub);
    if (params.has("model")) {
      const rawModel = params.get("model") || "";
      const models = category === "automotive" && nextSub !== "All"
        ? (CAR_MODELS[nextSub] || [])
        : [];
      setActiveModel(models.includes(rawModel) ? rawModel : "All");
    } else setActiveModel("All");
    setSearch(params.has("search") ? (params.get("search") || "").trim() : "");
    const validNumber = (key: string) => {
      if (!params.has(key)) return "";
      const value = params.get(key) || "";
      return /^\d+(?:\.\d+)?$/.test(value) ? value : "";
    };
    setPriceMin(validNumber("priceMin"));
    setPriceMax(validNumber("priceMax"));
    setYearMin(validNumber("yearMin"));
    setYearMax(validNumber("yearMax"));
    setKmMin(validNumber("kmMin"));
    setKmMax(validNumber("kmMax"));
    const nextCondition = params.get("condition") || "all";
    setCondition(["all", "new", "used", "refurbished"].includes(nextCondition) ? nextCondition : "all");
    const nextSort = params.get("sort") || "newest";
    setSortBy(["newest", "oldest", "price-low", "price-high"].includes(nextSort)
      ? nextSort as SortOption
      : "newest");
  }, [urlSearch, activeCategory, activeSubCategory]);

  useEffect(() => {
    savedFilters = {
      search, activeCategory, activeSubCategory, activeModel, sortBy,
      priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, condition,
    };
  }, [search, activeCategory, activeSubCategory, activeModel, sortBy, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, condition]);

  /*
   * Keep the active browse state in the current history entry. Opening a
   * listing then navigating back restores the exact filters from the URL,
   * including after Categories has unmounted.
   */
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("tab", activeCategory);
    if (activeSubCategory !== "All") params.set("subCategory", activeSubCategory);
    if (activeModel !== "All") params.set("model", activeModel);
    if (search.trim()) params.set("search", search.trim());
    if (sortBy !== "newest") params.set("sort", sortBy);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (yearMin) params.set("yearMin", yearMin);
    if (yearMax) params.set("yearMax", yearMax);
    if (kmMin) params.set("kmMin", kmMin);
    if (kmMax) params.set("kmMax", kmMax);
    if (condition !== "all") params.set("condition", condition);

    const nextSearch = params.toString();
    if (nextSearch === urlSearch) return;
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}?${nextSearch}`,
    );
  }, [
    urlSearch,
    search,
    activeCategory,
    activeSubCategory,
    activeModel,
    sortBy,
    priceMin,
    priceMax,
    yearMin,
    yearMax,
    kmMin,
    kmMax,
    condition,
  ]);

  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (!container) return;
    const handleScroll = () => { setSavedScroll(SCROLL_KEY, container.scrollTop); };
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
    const savedScrollY = getSavedScroll(SCROLL_KEY);
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
    if (condition !== "all") count++;
    return count;
  }, [activeSubCategory, activeModel, priceMin, priceMax, yearMin, yearMax, kmMin, kmMax, condition]);

  const clearAllFilters = () => {
    setActiveSubCategory("All");
    setActiveModel("All");
    setPriceMin("");
    setPriceMax("");
    setYearMin("");
    setYearMax("");
    setKmMin("");
    setKmMax("");
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
    if (yearMin) {
      const minYear = parseFloat(yearMin);
      filtered = filtered.filter(p => p.year != null && Number(p.year) >= minYear);
    }
    if (yearMax) {
      const maxYear = parseFloat(yearMax);
      filtered = filtered.filter(p => p.year != null && Number(p.year) <= maxYear);
    }
    if (kmMin) {
      const minKm = parseFloat(kmMin);
      filtered = filtered.filter(p => p.mileage != null && Number(p.mileage) >= minKm);
    }
    if (kmMax) {
      const maxKm = parseFloat(kmMax);
      filtered = filtered.filter(p => p.mileage != null && Number(p.mileage) <= maxKm);
    }
    if (condition !== "all") {
      const normalizedCondition = condition.trim().toLowerCase();
      filtered = filtered.filter(p =>
        typeof p.condition === "string" &&
        p.condition.trim().toLowerCase() === normalizedCondition
      );
    }
    if (sortBy === "oldest") {
      filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    } else if (sortBy === "price-low") {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "price-high") {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    
    return filtered;
  }, [
    products,
    activeModel,
    sortBy,
    activeCategory,
    activeSubCategory,
    priceMin,
    priceMax,
    yearMin,
    yearMax,
    kmMin,
    kmMax,
    condition,
  ]);

  if (isDesktopWeb) {
    return <div className="desktop-saman categories-desktop-surface min-h-full" dir={isRTL ? "rtl" : "ltr"}>
      <main className="desktop-browse-main">
        <section className="desktop-browse-hero" style={{ backgroundImage: theme === "nighttime" ? `linear-gradient(${isRTL ? "270deg" : "90deg"},rgba(5,10,14,.72),rgba(7,13,17,.32) 43%,rgba(5,10,14,.04) 76%),url(${dubaiNightSportsCar})` : `linear-gradient(${isRTL ? "270deg" : "90deg"},rgba(255,222,185,.96),rgba(255,201,148,.68) 47%,rgba(16,32,42,.12)),url(${dubaiNightSkyline})`, backgroundPosition: "center" }}><div><p>{isRTL ? "سوق الإمارات للسيارات وقطع الغيار" : "THE UAE'S AUTOMOTIVE MARKETPLACE"}</p><h1>{activeCategory === "automotive" ? (isRTL ? "اكتشف سيارتك القادمة." : "Find your next drive.") : (isRTL ? "كل قطعة في مكانها." : "The right part is out there.")}</h1></div><span>{isRTL ? "دبي · الإمارات" : "Dubai · UAE"}</span></section>
        <section className="desktop-search-panel"><div className="desktop-market-tabs"><button onClick={() => handleCategoryChange("automotive")} className={activeCategory === "automotive" ? "active" : ""}><Car size={15}/>{t("automotive")}</button><button onClick={() => handleCategoryChange("spare-parts")} className={activeCategory === "spare-parts" ? "active" : ""}><Wrench size={15}/>{t("spareParts")}</button></div><div className="desktop-search-row"><div className="desktop-query"><Search size={16}/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t("searchCategory")} data-testid="input-search-desktop" /></div><Select value={activeSubCategory} onValueChange={handleSubCategoryChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{getSubcategories().map(x => <SelectItem key={x} value={x}>{x === "All" ? (activeCategory === "automotive" ? t("allBrands") : t("allCategories")) : x}</SelectItem>)}</SelectContent></Select>{activeCategory === "automotive" && activeSubCategory !== "All" && getModelsForBrand().length > 0 && <ModelCombobox models={getModelsForBrand()} value={activeModel} onValueChange={setActiveModel} emptyValue="All" emptyLabel={t("allModels")} />}</div></section>
        <div className={`desktop-results-layout ${filterOpen ? "has-filters" : ""}`}>
          <DesktopFilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} isRTL={isRTL} automotive={activeCategory === "automotive"} categories={getSubcategories()} category={activeSubCategory} onCategory={handleSubCategoryChange} models={getModelsForBrand()} model={activeModel} onModel={setActiveModel} {...{ priceMin, setPriceMin, priceMax, setPriceMax, yearMin, setYearMin, yearMax, setYearMax, kmMin, setKmMin, kmMax, setKmMax, condition, setCondition }} clear={clearAllFilters} />
          <div className="desktop-results-content">
            {!filterOpen && <button onClick={() => setFilterOpen(true)} className="desktop-filters-reopen"><SlidersHorizontal size={14}/>{isRTL ? "إظهار الفلاتر" : "Show filters"}{activeFiltersCount ? <b>{activeFiltersCount}</b> : null}</button>}
            <section className="desktop-results-head"><div><h2>{isRTL ? "الإعلانات المتاحة" : "Available listings"}</h2><p>{filteredAndSortedProducts.length} {isRTL ? "إعلان" : "listings matching your search"}</p></div><div><ListingViewSwitcher includeList={isDesktopWeb} /><Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}><SelectTrigger className="desktop-sort"><ArrowUpDown size={14}/><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">{t("newest")}</SelectItem><SelectItem value="oldest">{t("oldest")}</SelectItem><SelectItem value="price-low">{t("priceUp")}</SelectItem><SelectItem value="price-high">{t("priceDown")}</SelectItem></SelectContent></Select></div></section>
            {isLoading ? <div className="desktop-card-grid">{Array.from({length: 8}).map((_, i) => <Skeleton key={i} className="h-64 rounded-lg" />)}</div> : error ? <div className="desktop-state"><p>Failed to load products</p><Button onClick={() => refetch()}>Retry</Button></div> : filteredAndSortedProducts.length ? <div className={`desktop-card-grid ${density === "compact" ? "compact" : ""} ${density === "single" ? "list" : ""}`}>{filteredAndSortedProducts.map(product => <ProductCard key={product.id} product={product} sellerImageUrl={(product as any).sellerProfileImageUrl} sellerFirstName={(product as any).sellerFirstName} sellerLastName={(product as any).sellerLastName} sellerDisplayName={(product as any).sellerDisplayName} showDate density={density} />)}</div> : <div className="desktop-state"><Car size={34}/><h3>{isRTL ? "لا توجد إعلانات مطابقة" : "No listings found"}</h3><Button variant="outline" onClick={clearAllFilters}>{isRTL ? "مسح الفلاتر" : "Clear filters"}</Button></div>}
          </div>
        </div>
      </main>
    </div>;
  }
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
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl" align="start" side="bottom" sideOffset={6} avoidCollisions={false}>
              <Command>
                <CommandInput placeholder={t('searchCategoryPlaceholder')} />
                <CommandList className="max-h-[50vh]">
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
            <ModelCombobox
              models={getModelsForBrand()}
              value={activeModel}
              onValueChange={setActiveModel}
              emptyValue="All"
              emptyLabel={t("allModels")}
              searchPlaceholder={t("searchModels")}
              noResultsLabel={t("noModelFound")}
              className="flex-1 h-9 font-semibold"
            />
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

                    <div className="grid grid-cols-1 gap-3">
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
                            <SelectItem value="refurbished">Refurbished</SelectItem>
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
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:opacity-70 touch-manipulation"
                  style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}
                  onClick={() => { setActiveSubCategory("All"); setActiveModel("All"); }}
                  data-testid="badge-filter-subcategory"
                >
                  {activeSubCategory}
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {activeModel !== "All" && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap active:opacity-70 touch-manipulation"
                  style={{ backgroundColor: '#fed7aa', color: '#9a3412' }}
                  onClick={() => setActiveModel("All")}
                  data-testid="badge-filter-model"
                >
                  {activeModel}
                  <X className="h-3.5 w-3.5" />
                </button>
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
      </div>
    </PullToRefresh>
  );
}
