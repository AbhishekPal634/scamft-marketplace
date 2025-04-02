
import { NFT, useNFTStore } from "./nftService";
import { supabase } from "../integrations/supabase/client";
import { toast } from "../hooks/use-toast";

// Define a type for the search response
interface SearchResponse {
  results: any[];
  count: number;
  error?: string;
}

// This function handles finding similar NFTs by matching tags or categories
export const findSimilarNFTs = async (nftId: string, limit: number = 4): Promise<NFT[]> => {
  try {
    console.log(`Finding similar NFTs to ${nftId}, limit: ${limit}`);
    
    // First, get the current NFT to find its tags and category
    const { data: currentNft, error: nftError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nftId)
      .single();
    
    if (nftError || !currentNft) {
      console.error("Error fetching current NFT:", nftError);
      return [];
    }
    
    // Get the tags and category from the current NFT
    const tags = currentNft.tags || [];
    const category = currentNft.category;
    
    // Find NFTs with matching tags or category, but exclude the current NFT
    let query = supabase
      .from('nfts')
      .select('*')
      .neq('id', nftId) // Exclude the current NFT
      .eq('listed', true) // Only include NFTs that are listed
      .limit(limit);
    
    // If we have tags, use them to find similar NFTs
    if (tags.length > 0) {
      // Use overlaps to find NFTs with at least one matching tag
      query = query.overlaps('tags', tags);
    } else if (category) {
      // If no tags, try matching by category
      query = query.eq('category', category);
    }
    
    const { data: similarNfts, error: searchError } = await query;
    
    if (searchError) {
      console.error("Error searching for similar NFTs:", searchError);
      return [];
    }
    
    // If we don't have enough results, try getting random NFTs instead
    if (!similarNfts || similarNfts.length < limit) {
      const remainingLimit = limit - (similarNfts?.length || 0);
      const { data: randomNfts, error: randomError } = await supabase
        .from('nfts')
        .select('*')
        .neq('id', nftId)
        .eq('listed', true)
        .limit(remainingLimit);
      
      if (randomError) {
        console.error("Error fetching random NFTs:", randomError);
      } else if (randomNfts) {
        // Combine the similar NFTs with the random NFTs
        return [...(similarNfts || []), ...randomNfts].map(mapNFTFromDatabase);
      }
    }
    
    // Map the database results to NFT objects
    return (similarNfts || []).map(mapNFTFromDatabase);
  } catch (error) {
    console.error("Error finding similar NFTs:", error);
    return [];
  }
};

// Helper function to map database results to NFT objects
const mapNFTFromDatabase = (item: any): NFT => ({
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
  isLiked: false,
  listed: item.listed !== false,
  owner_id: item.owner_id || item.creator_id,
});

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
    
    // Use the correct approach to get the Supabase URL and session
    const { data: sessionData } = await supabase.auth.getSession();
    
    // Get URL from the Supabase instance properly
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ntmogcnenelmbggucipy.supabase.co';
    const supabaseApiUrl = `${baseUrl}/functions/v1/search-nfts`;
    
    // Use direct fetch instead of supabase.functions.invoke to avoid potential issues
    const response = await fetch(
      supabaseApiUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData?.session?.access_token}`
        },
        body: requestBody
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Search error response:", errorText);
      throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
    }

    const responseData: SearchResponse = await response.json();
    
    if (!responseData || !responseData.results) {
      console.warn("Search returned no data or results property");
      return fallbackLocalSearch(query);
    }

    console.log(`Search returned ${responseData.results.length} results`);

    // Map the raw database results to NFT objects
    const mappedResults: NFT[] = responseData.results.map(mapNFTFromDatabase);

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

// Function to find similar NFTs using vector similarity
export const findSimilarNFTs = async (nftId: string, limit: number = 4): Promise<NFT[]> => {
  try {
    console.log(`Finding similar NFTs for ${nftId}`);
    
    // Call the Supabase function to find similar NFTs
    const { data, error } = await supabase.rpc(
      'find_similar_nfts',
      { 
        nft_id: nftId,
        match_count: limit 
      }
    );
    
    if (error) {
      console.error("Error finding similar NFTs:", error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log("No similar NFTs found");
      
      // Fallback to tag-based similarity
      return fallbackSimilarNFTs(nftId, limit);
    }
    
    // Fetch full NFT details for the similar NFTs
    const nftIds = data.map((item: any) => item.id);
    
    const { data: nftsData, error: nftsError } = await supabase
      .from('nfts')
      .select('*')
      .in('id', nftIds)
      .eq('listed', true)
      .limit(limit);
      
    if (nftsError) {
      console.error("Error fetching similar NFT details:", nftsError);
      throw nftsError;
    }
    
    // Map the raw database results to NFT objects
    const store = useNFTStore.getState();
    const mappedNfts = await Promise.all(nftsData.map(store.mapDbNftToNft || mapSimpleNft));
    
    return mappedNfts;
  } catch (error) {
    console.error("Error in findSimilarNFTs:", error);
    return fallbackSimilarNFTs(nftId, limit);
  }
};

// Simple mapper for NFTs when the store's mapper is not available
const mapSimpleNft = async (dbNft: any): Promise<NFT> => {
  let creatorName = "Artist";
  let creatorAvatar = '/placeholder.svg';
  
  if (dbNft.creator_id) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', dbNft.creator_id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching creator profile:', error);
      }
        
      if (profile) {
        creatorName = profile.full_name || profile.username || "Artist";
        creatorAvatar = profile.avatar_url || '/placeholder.svg';
      }
    } catch (error) {
      console.error('Error fetching creator profile:', error);
    }
  }
  
  return {
    id: dbNft.id,
    title: dbNft.title || 'Untitled NFT',
    description: dbNft.description || '',
    price: parseFloat(dbNft.price) || 0,
    image: dbNft.image_url || '/placeholder.svg',
    image_url: dbNft.image_url || '/placeholder.svg',
    creator: {
      id: dbNft.creator_id || '0',
      name: creatorName,
      avatar: creatorAvatar,
    },
    createdAt: dbNft.created_at || new Date().toISOString(),
    tags: dbNft.tags || [],
    category: dbNft.category || 'Art',
    editions: {
      total: dbNft.editions_total || 1,
      available: dbNft.editions_available || 1,
    },
    likes: dbNft.likes || 0,
    isLiked: false,
    owner_id: dbNft.owner_id || dbNft.creator_id,
    listed: dbNft.listed !== false,
  };
};

// Fallback to find similar NFTs based on tags when vector search fails
const fallbackSimilarNFTs = async (nftId: string, limit: number = 4): Promise<NFT[]> => {
  console.log("Using tag-based fallback for similar NFTs");
  
  try {
    // First get the original NFT
    const { data: originalNft, error: originalError } = await supabase
      .from('nfts')
      .select('*')
      .eq('id', nftId)
      .maybeSingle();
      
    if (originalError || !originalNft) {
      console.error("Error fetching original NFT:", originalError);
      return [];
    }
    
    // Get other NFTs with similar tags
    const { data: similarNfts, error: similarError } = await supabase
      .from('nfts')
      .select('*')
      .neq('id', nftId)  // Exclude the original NFT
      .eq('listed', true)
      .order('created_at', { ascending: false })
      .limit(limit);
      
    if (similarError || !similarNfts) {
      console.error("Error fetching similar NFTs by tag:", similarError);
      return [];
    }
    
    // Sort by tag overlap
    const originalTags = originalNft.tags || [];
    const sortedNfts = similarNfts.sort((a, b) => {
      const aTags = a.tags || [];
      const bTags = b.tags || [];
      
      const aOverlap = aTags.filter(tag => originalTags.includes(tag)).length;
      const bOverlap = bTags.filter(tag => originalTags.includes(tag)).length;
      
      return bOverlap - aOverlap;
    });
    
    const store = useNFTStore.getState();
    const mappedNfts = await Promise.all(sortedNfts.slice(0, limit).map(store.mapDbNftToNft || mapSimpleNft));
    
    return mappedNfts;
  } catch (error) {
    console.error("Error in fallbackSimilarNFTs:", error);
    return [];
  }
};
