
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NFT } from "@/services/nftService";
import { toast } from "@/components/ui/use-toast";

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
      const { data, error: supabaseError } = await supabase.functions.invoke('search-nfts', {
        body: { query },
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (supabaseError) {
        console.error("Search error:", supabaseError);
        throw new Error(supabaseError.message || "Search failed");
      }

      if (!data) {
        console.warn("Search returned no data");
        setResults([]);
        return;
      }

      if (data.error) {
        console.error("Search function error:", data.error);
        throw new Error(data.error);
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
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { search, results, isLoading, error };
};
