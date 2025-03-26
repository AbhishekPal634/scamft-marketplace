import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSearch } from "@/hooks/useSearch";

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  initialQuery?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "filled" | "outline";
}

const SearchBar = ({ 
  className = "",
  placeholder = "Search NFTs...",
  onSearch,
  initialQuery = "",
  size = "md",
  variant = "default"
}: SearchBarProps) => {
  const [query, setQuery] = useState(initialQuery);
  const navigate = useNavigate();
  const { search } = useSearch();
  const debounceTimerRef = useRef<number | null>(null);
  
  // Apply the search when initialQuery changes
  useEffect(() => {
    if (initialQuery && initialQuery !== query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // If onSearch prop is provided, use it
    if (onSearch) {
      onSearch(query);
    } else {
      // Otherwise navigate to the explore page with search parameter
      navigate(`/explore?search=${encodeURIComponent(query)}`);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Only trigger search with a delay and if onSearch is provided
    if (onSearch && newQuery.trim().length >= 2) {
      debounceTimerRef.current = window.setTimeout(() => {
        onSearch(newQuery);
      }, 500); // 500ms debounce delay
    }
  };
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Size classes
  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base"
  };
  
  // Variant classes
  const variantClasses = {
    default: "bg-background border",
    filled: "bg-secondary/50 border-none",
    outline: "bg-transparent border"
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className={`relative flex items-center ${className}`}
    >
      <div className="relative flex-grow">
        <Input
          type="search"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className={`pr-10 ${sizeClasses[size]} ${variantClasses[variant]} w-full`}
          aria-label="Search"
        />
        <Button 
          type="submit" 
          size="icon" 
          variant="ghost" 
          className="absolute right-0 top-0 h-full aspect-square text-muted-foreground hover:text-foreground"
        >
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
    </form>
  );
};

export default SearchBar;
