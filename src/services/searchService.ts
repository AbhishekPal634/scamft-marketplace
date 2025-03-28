import { NFT, useNFTStore } from "./nftService";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../components/ui/use-toast";

// Define a type for the search response
interface SearchResponse {
  results: any[];
  count: number;
  error?: string;
}

// This function uses the Supabase edge function for proper search
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  try {
    // Validate query before sending to edge function
    if (!query || query.trim() === '') {
      console.log("Empty query, returning empty results");
      return [];
    }

    console.log("Searching for NFTs with query:", query);
    
    // Add additional encoding to ensure the query is properly sent
    const requestBody = JSON.stringify({ query: query.trim(), limit: 20 });
    
    // Use direct fetch instead of supabase.functions.invoke to avoid potential issues
    const response = await fetch(
      `${supabase.supabaseUrl}/functions/v1/search-nfts`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: requestBody
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Search error response:", errorText);
      throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
    }

    const data: SearchResponse = await response.json();
    
    if (!data || !data.results) {
      console.warn("Search returned no data or results property");
      return fallbackLocalSearch(query);
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

    return mappedResults;
  } catch (error) {
    console.error("Search error:", error);
    toast({
      title: "Search Failed",
      description: "Using local search as fallback",
      variant: "destructive"
    });
    
    return fallbackLocalSearch(query);
  }
};

// Local search fallback when edge function search fails
const fallbackLocalSearch = async (query: string): Promise<NFT[]> => {
  console.log("Using local search as fallback");
  
  // Use the store's data
  const store = useNFTStore.getState();
  const allNFTs = store.nfts.length > 0 
    ? store.nfts.filter(nft => nft.listed !== false)
    : (await store.fetchMarketplaceNFTs());
  
  // Simple text search
  const searchTerms = query.toLowerCase().split(' ');
  
  return allNFTs.filter(nft => {
    const titleMatch = nft.title.toLowerCase().includes(query.toLowerCase());
    const descMatch = nft.description?.toLowerCase().includes(query.toLowerCase());
    const tagMatch = nft.tags?.some(tag => 
      searchTerms.some(term => tag.toLowerCase().includes(term))
    );
    const categoryMatch = nft.category?.toLowerCase().includes(query.toLowerCase());
    
    return titleMatch || descMatch || tagMatch || categoryMatch;
  });
};
