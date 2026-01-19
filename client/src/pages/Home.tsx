import { useState } from "react";
import { useProducts } from "@/hooks/use-products";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Box } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

const CATEGORIES = ["All", "Engine", "Body", "Electrical", "Interior", "Wheels", "Other"];

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Use debounce or just pass state directly for simplicity in this demo
  const { data: products, isLoading, error } = useProducts({ 
    search: search || undefined, 
    category: activeCategory 
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary py-20 sm:py-32">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent"></div>
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl mb-6">
              Find the <span className="text-accent">Perfect Part</span><br />
              For Your Machine
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 mb-10">
              The most trusted marketplace for authentic spare parts. 
              Connect with verified sellers and get your equipment back running.
            </p>
          </motion.div>

          {/* Search Bar */}
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
                  placeholder="Search by part name or number..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button className="h-10 px-6 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium">
                  Search
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Categories */}
        <div className="mb-12 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200
                  ${activeCategory === cat 
                    ? "bg-accent text-white shadow-lg shadow-accent/25 ring-2 ring-accent ring-offset-2 ring-offset-background" 
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-foreground">
              {activeCategory === "All" ? "Latest Arrivals" : `${activeCategory} Parts`}
            </h2>
            <span className="text-sm text-muted-foreground">
              {products ? `${products.length} items found` : "Loading..."}
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
          ) : error ? (
            <div className="text-center py-20 bg-destructive/5 rounded-2xl border border-destructive/20">
              <h3 className="text-lg font-bold text-destructive">Unable to load products</h3>
              <p className="text-muted-foreground mt-2">Please try refreshing the page.</p>
            </div>
          ) : products?.length === 0 ? (
            <div className="text-center py-32 bg-secondary/30 rounded-3xl border border-dashed border-border">
              <Box className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-bold text-foreground">No products found</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                We couldn't find any parts matching your criteria. Try adjusting your search or filters.
              </p>
              <Button 
                variant="outline" 
                className="mt-6"
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
