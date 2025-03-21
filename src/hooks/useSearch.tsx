
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NFT } from "@/services/nftService";

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
      const { data, error } = await supabase.functions.invoke('search-nfts', {
        body: { query }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResults(data?.results || []);
    } catch (err: any) {
      console.error("Search error:", err);
      setError(err.message || "Failed to search NFTs");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return { search, results, isLoading, error };
};
