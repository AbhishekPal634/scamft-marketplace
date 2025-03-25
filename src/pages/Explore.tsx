
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Filter, 
  ArrowUpDown, 
  X, 
  ChevronDown, 
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import NFTCard from "@/components/nft/NFTCard";
import { useNFTStore, NFTFilters, NFT } from "@/services/nftService";
import { searchNFTsByText } from "@/services/searchService";
import { useSearch } from "@/hooks/useSearch";

const Explore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { nfts, fetchMarketplaceNFTs, filterNFTs } = useNFTStore();
  const { search, results: searchResults, isLoading: isSearching } = useSearch();
  
  const [filteredNFTs, setFilteredNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortOption, setSortOption] = useState<string>("recent");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  
  // Extract query parameters on page load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get("category");
    const searchParam = params.get("search");
    
    if (category) {
      setActiveCategory(category.toLowerCase());
    }
    
    if (searchParam) {
      setSearchQuery(searchParam);
      // Trigger search if we have a search parameter
      search(searchParam);
    }
  }, [location.search, search]);
  
  // Fetch NFTs and apply initial filters
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // Always fetch marketplace NFTs (only those listed for sale)
      let data = nfts.length > 0 ? nfts : await fetchMarketplaceNFTs();
      
      if (searchQuery) {
        // Use the search results if we have a search query
        data = searchResults.length > 0 ? searchResults : await searchNFTsByText(searchQuery);
      } else {
        // Apply filters from URL if no search query
        const filters: NFTFilters = {
          sortBy: sortOption as any,
          minPrice: priceRange[0],
          maxPrice: priceRange[1],
          tags: activeTags.length > 0 ? activeTags : undefined,
        };
        
        if (activeCategory !== "all") {
          filters.category = activeCategory;
        }
        
        data = filterNFTs(filters);
      }
      
      setFilteredNFTs(data);
      setLoading(false);
    };
    
    initializeData();
  }, [
    nfts, 
    fetchMarketplaceNFTs, 
    activeCategory, 
    searchQuery,
    searchResults,
    location.search
  ]);
  
  // Apply filters whenever filter settings change
  useEffect(() => {
    if (loading || isSearching || searchQuery) return;
    
    const filters: NFTFilters = {
      sortBy: sortOption as any,
      minPrice: priceRange[0],
      maxPrice: priceRange[1],
      tags: activeTags.length > 0 ? activeTags : undefined,
    };
    
    if (activeCategory !== "all") {
      filters.category = activeCategory;
    }
    
    const filtered = filterNFTs(filters);
    setFilteredNFTs(filtered);
    
    // Update URL with filters
    const params = new URLSearchParams();
    if (activeCategory !== "all") {
      params.set("category", activeCategory);
    }
    
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    
    navigate({ search: params.toString() }, { replace: true });
  }, [
    activeCategory, 
    priceRange, 
    sortOption, 
    activeTags, 
    filterNFTs, 
    navigate,
    loading,
    isSearching,
    searchQuery
  ]);
  
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // Clear search when changing category
    if (searchQuery) {
      setSearchQuery("");
      const params = new URLSearchParams();
      params.set("category", category);
      navigate({ search: params.toString() }, { replace: true });
    }
  };
  
  const handleTagToggle = (tag: string) => {
    setActiveTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  const handleClearFilters = () => {
    setActiveCategory("all");
    setPriceRange([0, 1000]);
    setSortOption("recent");
    setActiveTags([]);
    setSearchQuery("");
    
    // Clear URL params
    navigate("/explore", { replace: true });
  };
  
  // All available categories
  const categories = [
    { id: "all", name: "All NFTs" },
    { id: "art", name: "Art" },
    { id: "photography", name: "Photography" },
    { id: "music", name: "Music" },
    { id: "video", name: "Video" },
    { id: "collectible", name: "Collectibles" },
  ];
  
  // Popular tags (in a real app, these would be dynamically generated)
  const popularTags = [
    "abstract", "space", "nature", "cityscape", "generative", 
    "pixel", "minimal", "cyberpunk", "portrait", "3D",
  ];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow pt-12 pb-16">
        <div className="page-container">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-medium mb-2">Explore NFTs</h1>
            <p className="text-muted-foreground">
              Discover unique digital art from creators around the world
            </p>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-2 w-full md:w-auto">
              {/* Sort Dropdown */}
              <Select 
                value={sortOption} 
                onValueChange={setSortOption}
              >
                <SelectTrigger className="w-[180px] rounded-full bg-secondary/60 border-none">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Recently Added</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Mobile Filter Button */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="rounded-full">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full sm:max-w-md">
                    <SheetHeader className="mb-4">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Refine your NFT search results
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-6">
                      {/* Mobile Categories */}
                      <div>
                        <h3 className="font-medium mb-3">Categories</h3>
                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => handleCategoryChange(category.id)}
                              className={`px-3 py-1.5 rounded-full text-sm ${
                                activeCategory === category.id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-secondary hover:bg-secondary/80"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Mobile Price Range */}
                      <div>
                        <h3 className="font-medium mb-3">Price Range (USD)</h3>
                        <div className="space-y-5">
                          <Slider
                            defaultValue={[0, 1000]}
                            max={1000}
                            step={10}
                            value={priceRange}
                            onValueChange={(value) => setPriceRange(value as [number, number])}
                            className="[&>[data-state=active]]:bg-primary"
                          />
                          <div className="flex justify-between text-sm">
                            <span>${priceRange[0]}</span>
                            <span>${priceRange[1]}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mobile Tags */}
                      <div>
                        <h3 className="font-medium mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {popularTags.map((tag) => (
                            <button
                              key={tag}
                              onClick={() => handleTagToggle(tag)}
                              className={`px-3 py-1.5 rounded-full text-sm ${
                                activeTags.includes(tag)
                                  ? "bg-primary/20 text-primary border border-primary/30"
                                  : "bg-secondary hover:bg-secondary/80 border border-transparent"
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex justify-between">
                        <Button
                          variant="outline"
                          onClick={handleClearFilters}
                        >
                          Clear All
                        </Button>
                        <SheetClose asChild>
                          <Button>Apply Filters</Button>
                        </SheetClose>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              
              {/* Clear Filters Button (shown when filters are active) */}
              {(activeCategory !== "all" || activeTags.length > 0 || 
                priceRange[0] > 0 || priceRange[1] < 1000 || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
          
          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden md:block space-y-8">
              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        activeCategory === category.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Price Range */}
              <div>
                <h3 className="font-medium mb-3">Price Range (USD)</h3>
                <div className="px-1 space-y-5">
                  <Slider
                    defaultValue={[0, 1000]}
                    max={1000}
                    step={10}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    className="[&>[data-state=active]]:bg-primary"
                  />
                  <div className="flex justify-between text-sm">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Tags */}
              <div>
                <h3 className="font-medium mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs ${
                        activeTags.includes(tag)
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-secondary hover:bg-secondary/80 border border-transparent"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* NFT Grid */}
            <div className="lg:col-span-3">
              {/* Active Filters Summary */}
              {(activeCategory !== "all" || searchQuery || activeTags.length > 0) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  
                  {activeCategory !== "all" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-secondary">
                      Category: {activeCategory}
                      <button 
                        onClick={() => handleCategoryChange("all")}
                        className="ml-1.5 hover:text-muted-foreground"
                        aria-label="Remove category filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {searchQuery && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-secondary">
                      Search: {searchQuery}
                      <button 
                        onClick={() => {
                          setSearchQuery("");
                          navigate("/explore", { replace: true });
                        }}
                        className="ml-1.5 hover:text-muted-foreground"
                        aria-label="Remove search filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {activeTags.map(tag => (
                    <span 
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-secondary"
                    >
                      Tag: {tag}
                      <button 
                        onClick={() => handleTagToggle(tag)}
                        className="ml-1.5 hover:text-muted-foreground"
                        aria-label={`Remove ${tag} tag filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* Results Count */}
              <div className="mb-6">
                <p className="text-sm text-muted-foreground">
                  {loading || isSearching
                    ? "Searching..."
                    : `Showing ${filteredNFTs.length} results`}
                </p>
              </div>
              
              {/* Loading State */}
              {(loading || isSearching) ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">
                      {isSearching ? "Searching NFTs..." : "Loading NFTs..."}
                    </p>
                  </div>
                </div>
              ) : filteredNFTs.length > 0 ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {filteredNFTs.map((nft) => (
                    <motion.div key={nft.id} variants={itemVariants}>
                      <NFTCard nft={nft} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center max-w-md">
                    <h3 className="text-lg font-medium mb-2">No NFTs Found</h3>
                    <p className="text-muted-foreground mb-6">
                      We couldn't find any NFTs matching your current filters. Try adjusting your filters or search terms.
                    </p>
                    <Button onClick={handleClearFilters}>
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Explore;
