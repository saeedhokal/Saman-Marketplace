import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Car, Wrench, Loader2, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES, CAR_MODELS } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "wouter";

type MainCategory = "automotive" | "spare-parts";
type SortOption = "newest" | "oldest" | "price-low" | "price-high";

export default function Categories() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MainCategory>("automotive");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [activeModel, setActiveModel] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "spare-parts") {
      setActiveCategory("spare-parts");
    } else if (tab === "automotive") {
      setActiveCategory("automotive");
    }
  }, [location]);
  
  const getMainCategoryFilter = () => {
    if (activeCategory === "spare-parts") return "Spare Parts";
    if (activeCategory === "automotive") return "Automotive";
    return undefined;
  };

  const { data: products, isLoading, error } = useProducts({ 
    search: search || undefined, 
    mainCategory: getMainCategoryFilter(),
    subCategory: activeSubCategory !== "All" ? activeSubCategory : undefined,
  });

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

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = [...products];
    
    if (activeCategory === "automotive" && activeModel !== "All" && activeSubCategory !== "All") {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(activeModel.toLowerCase())
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
  }, [products, activeModel, sortBy, activeCategory, activeSubCategory]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-14">
            <Link href="/">
              <button className="p-2 -ml-2 rounded-lg hover:bg-secondary transition-colors" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <h1 className="flex-1 text-center font-semibold text-lg pr-8">Categories</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4">
        <div className="flex items-center border border-border rounded-full px-4 py-2 mb-4">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            type="text"
            placeholder="Search for category..."
            className="border-0 shadow-none focus-visible:ring-0 text-base h-8 bg-transparent p-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>

        <div className="flex gap-3 mb-4">
          <button
            onClick={() => handleCategoryChange("automotive")}
            data-testid="tab-automotive"
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
            style={activeCategory === "automotive" 
              ? { backgroundColor: '#2563eb', color: 'white', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' } 
              : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <Car className="h-5 w-5" />
            Automotive
          </button>
          
          <button
            onClick={() => handleCategoryChange("spare-parts")}
            data-testid="tab-spare-parts"
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2"
            style={activeCategory === "spare-parts" 
              ? { backgroundColor: '#f97316', color: 'white', boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' } 
              : { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
          >
            <Wrench className="h-5 w-5" />
            Spare Parts
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <Select value={activeSubCategory} onValueChange={handleSubCategoryChange}>
            <SelectTrigger className="w-full" data-testid="select-category">
              <SelectValue placeholder="All Brands" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategories().map((cat) => (
                <SelectItem key={cat} value={cat} data-testid={`option-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  {cat === "All" ? "All Brands" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeCategory === "automotive" && getModelsForBrand().length > 0 && (
            <Select value={activeModel} onValueChange={setActiveModel}>
              <SelectTrigger className="w-full" data-testid="select-model">
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

          <Select value={sortBy} onValueChange={(val) => setSortBy(val as SortOption)}>
            <SelectTrigger className="w-full" data-testid="select-sort">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest to Oldest</SelectItem>
              <SelectItem value="oldest">Oldest to Newest</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
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
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
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
      </div>
    </div>
  );
}
