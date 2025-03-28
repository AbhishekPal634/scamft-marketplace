import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

export interface Creator {
  id: string;
  name: string;
  avatar: string;
}

export interface NFTEditions {
  total: number;
  available: number;
}

export interface NFT {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  image_url?: string; // Add this for backward compatibility
  creator: Creator;
  createdAt: string;
  tags: string[];
  category: string;
  editions: NFTEditions;
  likes: number;
  isLiked: boolean;
  owner_id?: string; // Add owner_id for ownership tracking
  listed: boolean; // Whether the NFT is currently listed for sale
  embedding?: number[]; // Add embedding property for vector search
}

export interface NFTFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'recent' | 'price_asc' | 'price_desc' | 'popular';
}

export interface Purchase {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  stripe_payment_id?: string;
  items: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  nft_id: string;
  quantity: number;
  price_per_item: number;
  nft: NFT;
}

// Map database NFT to frontend NFT model
const mapDbNftToNft = async (dbNft: any): Promise<NFT> => {
  // Fetch creator info if we have a creator_id
  let creatorName = "Artist";
  let creatorAvatar = '/placeholder.svg';
  
  if (dbNft.creator_id) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', dbNft.creator_id)
        .single();
        
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
    image_url: dbNft.image_url || '/placeholder.svg', // Keep both for compatibility
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
    owner_id: dbNft.owner_id || dbNft.creator_id, // Default owner is creator
    listed: dbNft.listed !== false, // Default to true if not specified
    embedding: dbNft.embedding ? JSON.parse(dbNft.embedding) : undefined,
  };
};

// Fix the purchase mapping function to ensure no promises in the output
const mapDbPurchaseToFrontend = async (purchase: any, purchaseItems: any[]): Promise<Purchase> => {
  // Process all NFTs first to resolve promises
  const processedItems = await Promise.all(
    purchaseItems.map(async (item) => {
      // If item.nft exists, map it through our mapper, otherwise create a placeholder
      const nftData = item.nft 
        ? await mapDbNftToNft(item.nft)
        : {
            id: item.nft_id,
            title: 'Unknown NFT',
            description: '',
            price: parseFloat(item.price_per_item) || 0,
            image: '/placeholder.svg',
            image_url: '/placeholder.svg',
            creator: { id: '0', name: 'Unknown', avatar: '/placeholder.svg' },
            createdAt: new Date().toISOString(),
            tags: [],
            category: 'Art',
            editions: { total: 1, available: 1 },
            likes: 0,
            isLiked: false,
            listed: false,
            owner_id: purchase.user_id,
          };
      
      return {
        id: item.id,
        purchase_id: item.purchase_id,
        nft_id: item.nft_id,
        quantity: item.quantity || 1,
        price_per_item: parseFloat(item.price_per_item) || 0,
        nft: nftData,
      };
    })
  );

  return {
    id: purchase.id,
    user_id: purchase.user_id,
    total_amount: parseFloat(purchase.total_amount) || 0,
    status: purchase.status || 'completed',
    created_at: purchase.created_at || new Date().toISOString(),
    stripe_payment_id: purchase.stripe_payment_id,
    items: processedItems,
  };
};

export interface NFTStore {
  nfts: NFT[];
  isLoading: boolean;
  loading: boolean; // Alias for isLoading for backward compatibility
  fetchNFTs: () => Promise<NFT[]>;
  toggleLike: (id: string) => void;
  getUserPurchases: (userId: string) => Promise<Purchase[]>;
  getUserNfts: (userId: string) => Promise<NFT[]>;
  filterNFTs: (filters: NFTFilters) => NFT[]; // Add filterNFTs method
  getNFTById: (id: string) => NFT | undefined; // Add getNFTById method
  listNFT: (nftId: string, price: number) => Promise<boolean>;
  unlistNFT: (nftId: string) => Promise<boolean>;
  fetchMarketplaceNFTs: () => Promise<NFT[]>;
}

export const useNFTStore = create<NFTStore>((set, get) => ({
  nfts: [],
  isLoading: false,
  // Alias loading to isLoading for backward compatibility
  get loading() {
    return get().isLoading;
  },
  
  fetchNFTs: async () => {
    try {
      set({ isLoading: true });
      
      const { data: nftsData, error } = await supabase
        .from('nfts')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching NFTs:', error);
        throw error;
      }
      
      // Use Promise.all to handle all the async mapDbNftToNft calls
      const mappedNfts = await Promise.all(nftsData.map(mapDbNftToNft));
      set({ nfts: mappedNfts, isLoading: false });
      return mappedNfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      set({ isLoading: false });
      return [];
    }
  },
  
  // Fetch only NFTs available in the marketplace (listed = true)
  fetchMarketplaceNFTs: async () => {
    try {
      set({ isLoading: true });
      
      const { data: nftsData, error } = await supabase
        .from('nfts')
        .select('*')
        .eq('listed', true)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('Error fetching marketplace NFTs:', error);
        throw error;
      }
      
      const mappedNfts = await Promise.all(nftsData.map(mapDbNftToNft));
      set({ nfts: mappedNfts, isLoading: false });
      return mappedNfts;
    } catch (error) {
      console.error('Error fetching marketplace NFTs:', error);
      set({ isLoading: false });
      return [];
    }
  },
  
  toggleLike: async (id: string) => {
    const { nfts } = get();
    const nft = nfts.find(n => n.id === id);
    if (!nft) return;

    // Optimistically update UI
    const isLiked = !nft.isLiked;
    const likesChange = isLiked ? 1 : -1;
    
    const updatedNfts = nfts.map((item) => 
      item.id === id 
        ? { ...item, isLiked, likes: item.likes + likesChange } 
        : item
    );
    
    set({ nfts: updatedNfts });
    
    // Update the database
    try {
      const { data, error } = await supabase
        .from('nfts')
        .update({ likes: nft.likes + likesChange })
        .eq('id', id);
        
      if (error) {
        console.error('Error updating likes:', error);
        // Revert on error
        set({ nfts });
      }
    } catch (error) {
      console.error('Error updating likes:', error);
      // Revert on error
      set({ nfts });
    }
  },
  
  getUserPurchases: async (userId: string) => {
    try {
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (purchasesError) {
        console.error('Error fetching purchases:', purchasesError);
        throw purchasesError;
      }
      
      const purchases: Purchase[] = [];
      
      for (const purchase of purchasesData) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('purchase_items')
          .select('*, nft:nfts(*)')
          .eq('purchase_id', purchase.id);
          
        if (itemsError) {
          console.error('Error fetching purchase items:', itemsError);
          continue;
        }
        
        // Use await here to resolve the promises
        const mappedPurchase = await mapDbPurchaseToFrontend(purchase, itemsData);
        purchases.push(mappedPurchase);
      }
      
      return purchases;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
  },
  
  getUserNfts: async (userId: string) => {
    try {
      set({ isLoading: true });
      
      // Get NFTs owned by this user
      const { data: ownedNfts, error: ownedError } = await supabase
        .from('nfts')
        .select('*')
        .eq('owner_id', userId);
        
      if (ownedError) {
        console.error('Error fetching owned NFTs:', ownedError);
        throw ownedError;
      }
      
      console.log('Fetched owned NFTs:', ownedNfts);
      
      const mappedNfts = await Promise.all(ownedNfts.map(mapDbNftToNft));
      set({ isLoading: false });
      return mappedNfts;
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      set({ isLoading: false });
      return [];
    }
  },

  // Add the filterNFTs method
  filterNFTs: (filters: NFTFilters) => {
    const { nfts } = get();
    
    let filteredNfts = [...nfts];
    
    // Filter by category
    if (filters.category && filters.category !== 'all') {
      filteredNfts = filteredNfts.filter(nft => 
        nft.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }
    
    // Filter by price range
    if (filters.minPrice !== undefined) {
      filteredNfts = filteredNfts.filter(nft => nft.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filteredNfts = filteredNfts.filter(nft => nft.price <= filters.maxPrice!);
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filteredNfts = filteredNfts.filter(nft => 
        nft.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'recent':
          filteredNfts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'price_asc':
          filteredNfts.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filteredNfts.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
          filteredNfts.sort((a, b) => b.likes - a.likes);
          break;
      }
    }
    
    return filteredNfts;
  },

  // Add the getNFTById method
  getNFTById: (id: string) => {
    const { nfts } = get();
    return nfts.find(nft => nft.id === id);
  },
  
  // Add listing management functions
  listNFT: async (nftId: string, price: number) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .update({ 
          price: price,
          listed: true
        })
        .eq('id', nftId);
        
      if (error) {
        console.error('Error listing NFT:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error listing NFT:', error);
      return false;
    }
  },
  
  unlistNFT: async (nftId: string) => {
    try {
      const { data, error } = await supabase
        .from('nfts')
        .update({ listed: false })
        .eq('id', nftId);
        
      if (error) {
        console.error('Error unlisting NFT:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error unlisting NFT:', error);
      return false;
    }
  }
}));
