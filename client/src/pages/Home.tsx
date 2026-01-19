import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Search, Car, Wrench, Loader2 } from "lucide-react";
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

type MainCategory = "automotive" | "spare-parts";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<MainCategory>("automotive");
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

  return (
    <div className="min-h-screen bg-background">
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

        <div className="flex border-b border-border">
          <button
            onClick={() => handleCategoryChange("automotive")}
            data-testid="tab-automotive"
            className={`
              flex-1 py-3 text-center font-medium text-base transition-all relative
              ${activeCategory === "automotive" 
                ? "text-foreground" 
                : "text-muted-foreground"}
            `}
          >
            Automotive
            {activeCategory === "automotive" && (
              <motion.div
                layoutId="tabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
          
          <button
            onClick={() => handleCategoryChange("spare-parts")}
            data-testid="tab-spare-parts"
            className={`
              flex-1 py-3 text-center font-medium text-base transition-all relative
              ${activeCategory === "spare-parts" 
                ? "text-foreground" 
                : "text-muted-foreground"}
            `}
          >
            Spare Parts
            {activeCategory === "spare-parts" && (
              <motion.div
                layoutId="tabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        <div className="py-4">
          <Select value={activeSubCategory} onValueChange={setActiveSubCategory}>
            <SelectTrigger className="w-full" data-testid="select-category">
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
  );
}
