
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NFT } from "@/services/nftService";
import { toast } from "@/components/ui/use-toast";

// Define a type for the search response
interface SearchResponse {
  results: any[];
  [key: string]: any;
}

export const useSearch = () => {
  const [results, setResults] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Searching for:", query);
      
      // Create a timeout promise
      const timeoutPromise = new Promise<{ error: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), 10000);
      });
      
      const searchPromise = supabase.functions.invoke<SearchResponse>('search-nfts', {
        body: { query },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Race between the search and the timeout
      const response = await Promise.race([searchPromise, timeoutPromise]);
      
      // Check if response has an error property from our edge function
      if ('error' in response) {
        console.error("Search function error:", response.error);
        throw new Error(response.error);
      }

      const data = response.data;
      
      if (!data) {
        console.warn("Search returned no data");
        setResults([]);
        return;
      }

      if (!data.results) {
        console.warn("Search returned no results property");
        setResults([]);
        return;
      }

      console.log(`Search returned ${data.results.length} results`);

      // Map the raw database results to NFT objects
      const mappedResults: NFT[] = data.results.map((item: any) => ({
        id: item.id,
        title: item.title || "Untitled NFT",
        description: item.description || "",
        price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
        image: item.image_url || "/placeholder.svg",
        image_url: item.image_url || "/placeholder.svg",
        creator: {
          id: item.creator_id || "0",
          name: item.creator_name || "Unknown Artist",
          avatar: item.creator_avatar || "/placeholder.svg",
        },
        createdAt: item.created_at || new Date().toISOString(),
        tags: item.tags || [],
        category: item.category || "Art",
        editions: {
          total: item.editions_total || 1,
          available: item.editions_available || 1,
        },
        likes: item.likes || 0,
        views: item.views || 0,
        isLiked: false,
        listed: item.listed !== false,
        owner_id: item.owner_id || item.creator_id,
      }));

      setResults(mappedResults);
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
  };

  return { search, results, isLoading, error };
};
