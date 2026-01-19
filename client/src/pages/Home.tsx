import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Car, Wrench } from "lucide-react";
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
      <section className="relative overflow-hidden bg-primary py-12 sm:py-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl mb-3">
              UAE's Marketplace for<br />
              <span className="text-accent">Parts & Vehicles</span>
            </h1>
            <p className="mx-auto max-w-md text-sm text-primary-foreground/80 mb-6">
              Find spare parts and vehicles from trusted sellers across the UAE.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-md"
          >
            <div className="flex items-center bg-white rounded-lg shadow-lg p-1.5">
              <Search className="ml-2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search parts, vehicles..."
                className="border-0 shadow-none focus-visible:ring-0 text-sm h-10 bg-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
              <Button 
                className="h-8 px-4 rounded-md bg-accent hover:bg-accent/90 text-white text-sm font-medium"
                data-testid="button-search"
              >
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-6">
        <div className="flex border-b mb-6">
          <button
            onClick={() => handleCategoryChange("automotive")}
            data-testid="tab-automotive"
            className={`
              py-3 px-4 text-sm font-semibold transition-all relative
              flex items-center gap-2
              ${activeCategory === "automotive" 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"}
            `}
          >
            <Car className="h-4 w-4" />
            <span>Automotive</span>
            {activeCategory === "automotive" && (
              <motion.div
                layoutId="categoryIndicator"
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
              py-3 px-4 text-sm font-semibold transition-all relative
              flex items-center gap-2
              ${activeCategory === "spare-parts" 
                ? "text-accent" 
                : "text-muted-foreground hover:text-foreground"}
            `}
          >
            <Wrench className="h-4 w-4" />
            <span>Spare Parts</span>
            {activeCategory === "spare-parts" && (
              <motion.div
                layoutId="categoryIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                initial={false}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mb-6">
          <Select value={activeSubCategory} onValueChange={setActiveSubCategory}>
            <SelectTrigger className="w-[180px]" data-testid="select-category">
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
          
          <span className="text-sm text-muted-foreground">
            {products ? `${products.length} items` : ""}
          </span>
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
