import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Box, Car, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";

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
      <section className="relative overflow-hidden bg-primary py-16 sm:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
              UAE's Marketplace for<br />
              <span className="text-accent">Parts & Vehicles</span>
            </h1>
            <p className="mx-auto max-w-xl text-base text-primary-foreground/80 mb-8">
              Find spare parts, vehicles, and motorcycles from trusted sellers across the UAE.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto max-w-xl relative"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-accent to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-xl shadow-2xl p-2">
                <Search className="ml-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search parts, vehicles, brands..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search"
                />
                <Button 
                  className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium"
                  data-testid="button-search"
                >
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden mb-8">
          <div className="flex border-b">
            <button
              onClick={() => handleCategoryChange("automotive")}
              data-testid="tab-automotive"
              className={`
                flex-1 py-4 px-6 text-center font-semibold text-base transition-all relative
                flex items-center justify-center gap-2
                ${activeCategory === "automotive" 
                  ? "text-accent" 
                  : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <Car className="h-5 w-5" />
              <span>Automotive</span>
              {activeCategory === "automotive" && (
                <motion.div
                  layoutId="categoryIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-accent"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
            
            <button
              onClick={() => handleCategoryChange("spare-parts")}
              data-testid="tab-spare-parts"
              className={`
                flex-1 py-4 px-6 text-center font-semibold text-base transition-all relative
                flex items-center justify-center gap-2
                ${activeCategory === "spare-parts" 
                  ? "text-accent" 
                  : "text-muted-foreground hover:text-foreground"}
              `}
            >
              <Wrench className="h-5 w-5" />
              <span>Spare Parts</span>
              {activeCategory === "spare-parts" && (
                <motion.div
                  layoutId="categoryIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-accent"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                {activeCategory === "automotive" ? "Browse Vehicles" : "Browse Spare Parts"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {products ? `${products.length} items` : "Loading..."}
              </span>
            </div>
            
            <div className="overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {getSubcategories().map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveSubCategory(cat)}
                    data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${activeSubCategory === cat 
                        ? "bg-accent text-white shadow-lg shadow-accent/25" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
                    `}
                  >
                    {cat === "All" ? "Explore All" : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${activeSubCategory}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ProductGrid products={products} isLoading={isLoading} error={error} setSearch={setSearch} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function ProductGrid({ 
  products, 
  isLoading, 
  error, 
  setSearch 
}: { 
  products: any[] | undefined; 
  isLoading: boolean; 
  error: Error | null;
  setSearch: (s: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
        <h3 className="text-lg font-bold text-destructive">Unable to load listings</h3>
        <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-32 bg-secondary/30 rounded-3xl border border-dashed border-border">
        <Box className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
        <h3 className="text-xl font-bold text-foreground">No listings found</h3>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          Try adjusting your search or browse a different category.
        </p>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={() => setSearch("")}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
