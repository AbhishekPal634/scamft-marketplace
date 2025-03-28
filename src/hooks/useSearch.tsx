import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NFT } from "@/services/nftService";
import { toast } from "@/components/ui/use-toast";
import { searchNFTsByText } from "@/services/searchService";

// Define a type for the search response
export interface SearchResponse {
  results: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    image_url: string;
    category: string;
    tags: string[];
    creator_id: string;
    creator_name: string;
    creator_avatar: string;
    editions_total: number;
    editions_available: number;
    likes: number;
    views: number;
    listed: boolean;
    created_at: string;
    owner_id?: string; // Add owner_id as optional property
  }>;
  count: number;
  error?: string;
}

export const useSearch = () => {
  const [results, setResults] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Searching for:", query);
      
      // Use the searchNFTsByText function from searchService which has better error handling
      const nfts = await searchNFTsByText(query);
      
      console.log(`Search returned ${nfts.length} results`);
      setResults(nfts);
    } catch (err: any) {
      console.error("Search error:", err);
      const errorMessage = err.message || "Failed to search NFTs";
      setError(errorMessage);
      
      // Only show toast for non-abort errors
      if (err.name !== 'AbortError') {
        toast({
          title: "Search Failed",
          description: "Using local search as fallback",
          variant: "destructive"
        });
      }
      
      // Fallback to empty results - we'll rely on the Explore page's default behavior
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { search, results, isLoading, error };
};
