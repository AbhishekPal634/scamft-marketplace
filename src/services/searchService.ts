
import { NFT, useNFTStore } from "./nftService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

// This function uses the Supabase edge function for proper vector search
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  try {
    console.log("Searching for NFTs with query:", query);
    const { data, error } = await supabase.functions.invoke('search-nfts', {
      body: { query, limit: 20 }
    });

    if (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "An error occurred while searching. Please try again.",
        variant: "destructive"
      });
      throw error;
    }

    if (!data || !data.results) {
      console.warn("Search returned no data or results property");
      return [];
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
    
    // Fallback to local search if edge function fails
    const store = useNFTStore.getState();
    const allNFTs = store.nfts.length > 0 
      ? store.nfts.filter(nft => nft.listed !== false)
      : (await store.fetchMarketplaceNFTs());
    
    // Simple text search
    return allNFTs.filter(nft => 
      nft.title.toLowerCase().includes(query.toLowerCase()) ||
      nft.description?.toLowerCase().includes(query.toLowerCase()) ||
      nft.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase())) ||
      nft.category?.toLowerCase().includes(query.toLowerCase())
    );
  }
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
      const { data, error } = await supabase.functions.invoke('search-nfts', {
        body: { 
          embedding: nft.embedding,
          limit: limit + 1 // Request one more so we can filter out the current NFT
        }
      });
      
      if (error) {
        console.error("Search error:", error);
        throw error;
      }
      
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
