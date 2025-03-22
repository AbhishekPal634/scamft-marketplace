
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
  creator: Creator;
  createdAt: string;
  tags: string[];
  category: string;
  editions: NFTEditions;
  likes: number;
  views: number;
  isLiked: boolean;
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
const mapDbNftToNft = (dbNft: any): NFT => {
  return {
    id: dbNft.id,
    title: dbNft.title || 'Untitled NFT',
    description: dbNft.description || '',
    price: parseFloat(dbNft.price) || 0,
    image: dbNft.image_url || '/placeholder.svg',
    creator: {
      id: dbNft.creator_id || '0',
      name: 'Unknown Artist', // You might want to fetch this from profiles table
      avatar: '/placeholder.svg', // Default avatar
    },
    createdAt: dbNft.created_at || new Date().toISOString(),
    tags: dbNft.tags || [],
    category: dbNft.category || 'Art',
    editions: {
      total: dbNft.editions_total || 1,
      available: dbNft.editions_available || 1,
    },
    likes: dbNft.likes || 0,
    views: dbNft.views || 0,
    isLiked: false, // You might want to fetch this from a user_likes table
  };
};

const mapDbPurchaseToFrontend = (purchase: any, purchaseItems: any[]): Purchase => {
  return {
    id: purchase.id,
    user_id: purchase.user_id,
    total_amount: parseFloat(purchase.total_amount) || 0,
    status: purchase.status || 'completed',
    created_at: purchase.created_at || new Date().toISOString(),
    stripe_payment_id: purchase.stripe_payment_id,
    items: purchaseItems.map(item => ({
      id: item.id,
      purchase_id: item.purchase_id,
      nft_id: item.nft_id,
      quantity: item.quantity || 1,
      price_per_item: parseFloat(item.price_per_item) || 0,
      nft: item.nft ? mapDbNftToNft(item.nft) : {} as NFT,
    })),
  };
};

export interface NFTStore {
  nfts: NFT[];
  isLoading: boolean;
  fetchNFTs: () => Promise<NFT[]>;
  toggleLike: (id: string) => void;
  getUserPurchases: (userId: string) => Promise<Purchase[]>;
  getUserNfts: (userId: string) => Promise<NFT[]>;
}

export const useNFTStore = create<NFTStore>((set, get) => ({
  nfts: [],
  isLoading: false,
  
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
      
      const mappedNfts = nftsData.map(mapDbNftToNft);
      set({ nfts: mappedNfts, isLoading: false });
      return mappedNfts;
    } catch (error) {
      console.error('Error fetching NFTs:', error);
      set({ isLoading: false });
      return [];
    }
  },
  
  toggleLike: (id: string) => {
    const { nfts } = get();
    const updatedNfts = nfts.map((nft) => {
      if (nft.id === id) {
        const isLiked = !nft.isLiked;
        const likesChange = isLiked ? 1 : -1;
        
        // In a real application, you would make an API call here
        // to update the like status in the database
        
        return {
          ...nft,
          isLiked,
          likes: nft.likes + likesChange,
        };
      }
      return nft;
    });
    
    set({ nfts: updatedNfts });
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
        
        purchases.push(mapDbPurchaseToFrontend(purchase, itemsData));
      }
      
      return purchases;
    } catch (error) {
      console.error('Error fetching user purchases:', error);
      return [];
    }
  },
  
  getUserNfts: async (userId: string) => {
    try {
      // First get all purchase items for the user
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed');
        
      if (purchasesError) {
        console.error('Error fetching user purchases:', purchasesError);
        throw purchasesError;
      }
      
      if (purchases.length === 0) {
        return [];
      }
      
      const purchaseIds = purchases.map(p => p.id);
      
      const { data: purchaseItems, error: itemsError } = await supabase
        .from('purchase_items')
        .select('*, nft:nfts(*)')
        .in('purchase_id', purchaseIds);
        
      if (itemsError) {
        console.error('Error fetching purchase items:', itemsError);
        throw itemsError;
      }
      
      // Map and deduplicate NFTs
      const nftMap = new Map<string, any>();
      purchaseItems.forEach(item => {
        if (item.nft && !nftMap.has(item.nft.id)) {
          nftMap.set(item.nft.id, item.nft);
        }
      });
      
      return Array.from(nftMap.values()).map(mapDbNftToNft);
    } catch (error) {
      console.error('Error fetching user NFTs:', error);
      return [];
    }
  }
}));
