
import { NFT, useNFTStore } from "./nftService";
import { supabase } from "@/integrations/supabase/client";

// This function now uses the Supabase edge function for proper vector search
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-nfts', {
      body: { query, limit: 20 }
    });

    if (error) {
      console.error("Search error:", error);
      throw error;
    }

    // Filter out any NFTs that aren't listed
    const listedNfts = data?.results?.filter(nft => nft.listed !== false) || [];
    
    return listedNfts;
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
      const { data, error } = await supabase.functions.invoke('search-nfts', {
        body: { 
          embedding: nft.embedding,
          limit: limit + 1 // Request one more so we can filter out the current NFT
        }
      });
      
      if (error) throw error;
      
      // Filter out the current NFT and any unlisted NFTs
      const similarNfts = data?.results
        .filter(item => item.id !== nftId && item.listed !== false)
        .slice(0, limit) || [];
        
      if (similarNfts.length > 0) {
        return similarNfts;
      }
    }
    
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
