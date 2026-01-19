import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car, Wrench, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MainCategory = "automotive" | "spare-parts" | null;

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MainCategory>(null);
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  
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
  };

  if (!activeCategory) {
    return (
      <div className="min-h-screen bg-primary flex flex-col">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center bg-white/10 backdrop-blur rounded-lg p-1.5 max-w-md mx-auto mb-8">
            <Search className="ml-2 h-4 w-4 text-white/60" />
            <Input
              type="text"
              placeholder="Search parts, vehicles..."
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-10 bg-transparent text-white placeholder:text-white/60"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value) {
                  setActiveCategory("automotive");
                }
              }}
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row">
          <motion.button
            onClick={() => handleCategoryChange("automotive")}
            className="flex-1 relative overflow-hidden group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            data-testid="category-automotive"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
            
            <div className="relative h-full min-h-[40vh] md:min-h-[60vh] flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <Car className="h-12 w-12 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Automotive</h2>
              <p className="text-white/60 text-center max-w-xs mb-6">
                Cars, motorcycles, and vehicles
              </p>
              <div className="flex items-center gap-2 text-accent font-medium">
                <span>Browse</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          <div className="h-px md:h-auto md:w-px bg-white/10" />

          <motion.button
            onClick={() => handleCategoryChange("spare-parts")}
            className="flex-1 relative overflow-hidden group"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            data-testid="category-spare-parts"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-primary/80" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PC9zdmc+')] opacity-30" />
            
            <div className="relative h-full min-h-[40vh] md:min-h-[60vh] flex flex-col items-center justify-center p-8">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <Wrench className="h-12 w-12 text-accent" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">Spare Parts</h2>
              <p className="text-white/60 text-center max-w-xs mb-6">
                Engine, body, and accessories
              </p>
              <div className="flex items-center gap-2 text-accent font-medium">
                <span>Browse</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setActiveCategory(null)}
              className="text-white/80 hover:text-white hover:bg-white/10"
              data-testid="button-back"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              Back
            </Button>
            
            <div className="flex-1 flex items-center bg-white/10 backdrop-blur rounded-lg p-1 max-w-sm">
              <Search className="ml-2 h-4 w-4 text-white/60" />
              <Input
                type="text"
                placeholder="Search..."
                className="border-0 shadow-none focus-visible:ring-0 text-sm h-8 bg-transparent text-white placeholder:text-white/60"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-results"
              />
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              {activeCategory === "automotive" ? (
                <Car className="h-5 w-5 text-accent" />
              ) : (
                <Wrench className="h-5 w-5 text-accent" />
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {activeCategory === "automotive" ? "Automotive" : "Spare Parts"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {products ? `${products.length} listings` : "Loading..."}
              </p>
            </div>
          </div>
          
          <Select value={activeSubCategory} onValueChange={setActiveSubCategory}>
            <SelectTrigger className="w-[160px]" data-testid="select-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {getSubcategories().map((cat) => (
                <SelectItem key={cat} value={cat} data-testid={`option-${cat.toLowerCase().replace(/\s+/g, '-')}`}>
                  {cat === "All" ? "All Categories" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive">Failed to load products</p>
          </div>
        ) : products && products.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${activeCategory}-${activeSubCategory}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
              {activeCategory === "automotive" ? (
                <Car className="h-8 w-8 text-muted-foreground" />
              ) : (
                <Wrench className="h-8 w-8 text-muted-foreground" />
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
  );
}
