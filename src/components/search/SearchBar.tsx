
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import BlurImage from "@/components/ui/BlurImage";
import { useSearch } from "@/hooks/useSearch";

interface SearchBarProps {
  fullWidth?: boolean;
  autoFocus?: boolean;
  className?: string;
}

const SearchBar = ({ fullWidth = false, autoFocus = false, className = "" }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const { search, results, isLoading, error } = useSearch();
  
  // Clear search when changing routes
  useEffect(() => {
    setQuery("");
    setShowResults(false);
  }, [location.pathname]);
  
  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);
  
  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Debounced search function
  useEffect(() => {
    if (!query.trim()) {
      setShowResults(false);
      return;
    }
    
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        search(query);
        setShowResults(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [query, search]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query);
      if (query.trim().length >= 2) {
        navigate(`/explore?search=${encodeURIComponent(query.trim())}`);
        setShowResults(false);
      }
    }
  };
  
  const handleResultClick = (id: string) => {
    navigate(`/nft/${id}`);
    setShowResults(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex">
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search for NFTs, collections, or artists..."
          className={`${fullWidth ? "w-full" : "w-64 md:w-80 lg:w-96"} rounded-l-full bg-secondary/70 border-none focus:ring-primary pr-10`}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
        />
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2 flex items-center">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 mr-1"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Button 
          type="submit" 
          className="rounded-r-full"
        >
          Search
        </Button>
      </form>
      
      {/* Search Results */}
      <AnimatePresence>
        {showResults && (query.trim().length >= 2) && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-0 right-0 mt-2 p-2 rounded-lg glass shadow-lg z-50 border border-border max-h-[70vh] overflow-y-auto bg-background"
          >
            {isLoading ? (
              <div className="py-8 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                <p className="mt-2 text-muted-foreground text-sm">Searching...</p>
              </div>
            ) : error ? (
              <div className="py-6 text-center">
                <p className="text-red-500 mb-2">Unable to search</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => search(query)}
                >
                  Try Again
                </Button>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.slice(0, 5).map((nft) => (
                  <div
                    key={nft.id}
                    className="flex items-center gap-3 p-2 hover:bg-secondary/60 rounded-md cursor-pointer transition-colors"
                    onClick={() => handleResultClick(nft.id)}
                  >
                    <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                      <BlurImage
                        src={nft.image}
                        alt={nft.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{nft.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        by {nft.creator.name}
                      </p>
                      <div className="text-xs font-medium mt-0.5">${nft.price.toFixed(2)} USD</div>
                    </div>
                  </div>
                ))}
                <div className="pt-1 pb-1 text-center">
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => navigate(`/explore?search=${encodeURIComponent(query.trim())}`)}
                  >
                    View all {results.length} results
                  </Button>
                </div>
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground">No results found for "{query}"</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-1"
                  onClick={() => navigate("/explore")}
                >
                  Browse all NFTs
                </Button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
