import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Box, Car, Wrench, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { SPARE_PARTS_SUBCATEGORIES, AUTOMOTIVE_SUBCATEGORIES } from "@shared/schema";

type TabValue = "all" | "spare-parts" | "automotive";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  
  const getMainCategoryFilter = () => {
    if (activeTab === "spare-parts") return "Spare Parts";
    if (activeTab === "automotive") return "Automotive";
    return undefined;
  };

  const { data: products, isLoading, error } = useProducts({ 
    search: search || undefined, 
    mainCategory: getMainCategoryFilter(),
    subCategory: activeSubCategory !== "All" ? activeSubCategory : undefined,
  });

  const getSubcategories = () => {
    if (activeTab === "spare-parts") {
      return ["All", ...SPARE_PARTS_SUBCATEGORIES];
    } else if (activeTab === "automotive") {
      return ["All", ...AUTOMOTIVE_SUBCATEGORIES];
    }
    return [];
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabValue);
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
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 h-12">
              <TabsTrigger value="all" className="gap-2 px-6" data-testid="tab-explore-all">
                <Compass className="h-4 w-4" />
                <span className="hidden sm:inline">Explore All</span>
                <span className="sm:hidden">All</span>
              </TabsTrigger>
              <TabsTrigger value="spare-parts" className="gap-2 px-6" data-testid="tab-spare-parts">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Spare Parts</span>
                <span className="sm:hidden">Parts</span>
              </TabsTrigger>
              <TabsTrigger value="automotive" className="gap-2 px-6" data-testid="tab-automotive">
                <Car className="h-4 w-4" />
                <span className="hidden sm:inline">Automotive</span>
                <span className="sm:hidden">Vehicles</span>
              </TabsTrigger>
            </TabsList>
            
            <span className="text-sm text-muted-foreground">
              {products ? `${products.length} items found` : "Loading..."}
            </span>
          </div>

          {activeTab !== "all" && (
            <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                {getSubcategories().map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveSubCategory(cat)}
                    data-testid={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap
                      ${activeSubCategory === cat 
                        ? "bg-accent text-white shadow-lg shadow-accent/25 ring-2 ring-accent ring-offset-2 ring-offset-background" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            <ProductGrid products={products} isLoading={isLoading} error={error} setSearch={setSearch} />
          </TabsContent>
          
          <TabsContent value="spare-parts" className="mt-0">
            <ProductGrid products={products} isLoading={isLoading} error={error} setSearch={setSearch} />
          </TabsContent>
          
          <TabsContent value="automotive" className="mt-0">
            <ProductGrid products={products} isLoading={isLoading} error={error} setSearch={setSearch} />
          </TabsContent>
        </Tabs>
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
