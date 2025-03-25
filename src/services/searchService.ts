
import { NFT, useNFTStore } from "./nftService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// This function uses the Supabase edge function for proper vector search
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  try {
    console.log("Searching for NFTs with query:", query);
    
    // Create a timeout promise
    const timeoutPromise = new Promise<{ error: string }>((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout')), 10000);
    });
    
    const searchPromise = supabase.functions.invoke('search-nfts', {
      body: { query, limit: 20 },
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    // Race between the search and the timeout
    const response = await Promise.race([searchPromise, timeoutPromise]);
    
    if ('error' in response) {
      console.error("Search error:", response.error);
      toast({
        title: "Search Failed",
        description: "Using local search as fallback",
        variant: "destructive"
      });
      
      // Fallback to local search
      return fallbackLocalSearch(query);
    }

    const data = response;
    
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

// Find similar NFTs to a given NFT
export const findSimilarNFTs = async (nftId: string, limit = 4): Promise<NFT[]> => {
  const store = useNFTStore.getState();
  const nft = store.getNFTById(nftId);
  
  if (!nft) {
    return [];
  }
  
  try {
    // If NFT has embedding, try to use vector search
    if (nft.embedding) {
      console.log("Finding similar NFTs using embedding");
      
      // Create a timeout promise
      const timeoutPromise = new Promise<{ error: string }>((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout')), 10000);
      });
      
      const searchPromise = supabase.functions.invoke('search-nfts', {
        body: { 
          embedding: nft.embedding,
          limit: limit + 1 // Request one more so we can filter out the current NFT
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Race between the search and the timeout
      const response = await Promise.race([searchPromise, timeoutPromise]);
      
      if ('error' in response) {
        console.error("Search error:", response.error);
        throw new Error(response.error);
      }
      
      const data = response;
      
      // Filter out the current NFT and any unlisted NFTs
      const similarNfts = data?.results
        .filter((item: any) => item.id !== nftId && item.listed !== false)
        .slice(0, limit) || [];
        
      if (similarNfts.length > 0) {
        // Map the raw database results to NFT objects
        const mappedResults: NFT[] = similarNfts.map((item: any) => ({
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
      }
    }
    
    console.log("Falling back to tag-based similarity");
    // Fallback to tag-based similarity
    const allNFTs = store.nfts.length > 0 
      ? store.nfts.filter(item => item.id !== nftId && item.listed !== false)
      : (await store.fetchMarketplaceNFTs()).filter(item => item.id !== nftId);
      
    // Score NFTs by number of matching tags
    const scoredNfts = allNFTs.map(item => {
      const matchingTags = item.tags?.filter(tag => nft.tags.includes(tag)).length || 0;
      const categoryMatch = item.category === nft.category ? 1 : 0;
      return { 
        ...item, 
        score: matchingTags + categoryMatch
      };
    });
    
    // Sort by score and return top matches
    return scoredNfts
      .sort((a, b) => (b as any).score - (a as any).score)
      .slice(0, limit);
      
  } catch (error) {
    console.error("Error finding similar NFTs:", error);
    return [];
  }
};
