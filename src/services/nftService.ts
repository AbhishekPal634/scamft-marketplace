
import { create } from "zustand";

export interface NFT {
  id: string;
  title: string;
  description: string;
  price: number;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  image: string;
  category: "art" | "photography" | "music" | "video" | "collectible";
  tags: string[];
  createdAt: string;
  editions: {
    total: number;
    available: number;
  };
  likes: number;
  views: number;
  isLiked?: boolean;
  embedding?: number[]; // Vector embedding for similar search
}

// Sample NFT data with embeddings (simplified)
const sampleNFTs: NFT[] = [
  {
    id: "nft-001",
    title: "Cosmic Dreams #137",
    description: "A journey through the cosmic dream landscape, where reality bends and new dimensions emerge.",
    price: 0.5,
    creator: {
      id: "creator-1",
      name: "NebulaArtist",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["abstract", "space", "colorful", "digital"],
    createdAt: "2023-09-15T10:30:00Z",
    editions: {
      total: 10,
      available: 3,
    },
    likes: 128,
    views: 1452,
    embedding: [0.2, 0.5, 0.3, 0.8, 0.1], // Simulated embedding
  },
  {
    id: "nft-002",
    title: "Digital Genesis",
    description: "The birth of digital consciousness, represented through algorithmic patterns and emergent structures.",
    price: 1.2,
    creator: {
      id: "creator-2",
      name: "DigitalSculptor",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    image: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["generative", "algorithm", "procedural", "futuristic"],
    createdAt: "2023-10-02T14:15:00Z",
    editions: {
      total: 5,
      available: 2,
    },
    likes: 89,
    views: 976,
    embedding: [0.7, 0.2, 0.4, 0.1, 0.6], // Simulated embedding
  },
  {
    id: "nft-003",
    title: "Neon City Pulse",
    description: "A cyberpunk vision of urban life, where technology and humanity intersect in a neon-lit metropolis.",
    price: 0.75,
    creator: {
      id: "creator-3",
      name: "CyberVisions",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&auto=format&fit=crop",
    category: "photography",
    tags: ["cyberpunk", "city", "neon", "urban"],
    createdAt: "2023-08-24T20:45:00Z",
    editions: {
      total: 15,
      available: 7,
    },
    likes: 205,
    views: 2341,
    embedding: [0.4, 0.8, 0.1, 0.3, 0.5], // Simulated embedding
  },
  {
    id: "nft-004",
    title: "Quantum Fragments",
    description: "Fragments of quantum reality brought together in a harmonious composition that transcends space and time.",
    price: 1.8,
    creator: {
      id: "creator-4",
      name: "QuantumArtist",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    image: "https://images.unsplash.com/photo-1633107886062-42a83a574950?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["quantum", "abstract", "fragmented", "digital art"],
    createdAt: "2023-11-05T09:20:00Z",
    editions: {
      total: 8,
      available: 1,
    },
    likes: 176,
    views: 1823,
    embedding: [0.3, 0.6, 0.9, 0.2, 0.4], // Simulated embedding
  },
  {
    id: "nft-005",
    title: "Ethereal Soundscape",
    description: "A visual representation of sound, capturing the ethereal quality of a unique audio composition.",
    price: 0.9,
    creator: {
      id: "creator-5",
      name: "AudioVisualizer",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    image: "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=800&auto=format&fit=crop",
    category: "music",
    tags: ["audio", "sound", "visualization", "ethereal"],
    createdAt: "2023-10-20T15:30:00Z",
    editions: {
      total: 12,
      available: 5,
    },
    likes: 143,
    views: 1567,
    embedding: [0.1, 0.3, 0.7, 0.9, 0.2], // Simulated embedding
  },
  {
    id: "nft-006",
    title: "Natural Algorithms",
    description: "Patterns found in nature, recreated through algorithmic processes to reveal the mathematical beauty of our world.",
    price: 0.65,
    creator: {
      id: "creator-6",
      name: "NatureCode",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    image: "https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["nature", "algorithm", "patterns", "generative"],
    createdAt: "2023-09-30T12:10:00Z",
    editions: {
      total: 20,
      available: 11,
    },
    likes: 98,
    views: 1089,
    embedding: [0.8, 0.2, 0.4, 0.6, 0.3], // Simulated embedding
  },
  {
    id: "nft-007",
    title: "Retro Pixel Dreams",
    description: "A nostalgic journey to the early days of digital art, celebrating pixel aesthetics with a modern twist.",
    price: 0.4,
    creator: {
      id: "creator-7",
      name: "PixelPioneer",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    image: "https://images.unsplash.com/photo-1616509091023-c6cffc70daa7?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["pixel", "retro", "8bit", "gaming"],
    createdAt: "2023-11-12T16:40:00Z",
    editions: {
      total: 25,
      available: 18,
    },
    likes: 112,
    views: 1356,
    embedding: [0.5, 0.9, 0.1, 0.4, 0.7], // Simulated embedding
  },
  {
    id: "nft-008",
    title: "Fluid Dynamics",
    description: "Capturing the mesmerizing beauty of fluid motion in a frozen moment of digital perfection.",
    price: 1.5,
    creator: {
      id: "creator-8",
      name: "FlowStudio",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    image: "https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?w=800&auto=format&fit=crop",
    category: "art",
    tags: ["fluid", "dynamic", "motion", "abstract"],
    createdAt: "2023-10-08T08:50:00Z",
    editions: {
      total: 7,
      available: 2,
    },
    likes: 167,
    views: 1935,
    embedding: [0.6, 0.2, 0.8, 0.3, 0.1], // Simulated embedding
  },
];

interface NFTStore {
  nfts: NFT[];
  featured: NFT[];
  loading: boolean;
  fetchNFTs: () => Promise<NFT[]>;
  getNFTById: (id: string) => NFT | undefined;
  toggleLike: (id: string) => void;
  searchNFTs: (query: string) => NFT[];
  filterNFTs: (filters: NFTFilters) => NFT[];
}

export interface NFTFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: "price_asc" | "price_desc" | "recent" | "popular";
}

export const useNFTStore = create<NFTStore>((set, get) => ({
  nfts: [],
  featured: [],
  loading: false,
  
  fetchNFTs: async () => {
    set({ loading: true });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real app, this would be a fetch request to your API
    set({ 
      nfts: sampleNFTs,
      featured: sampleNFTs.slice(0, 4),
      loading: false 
    });
    
    return sampleNFTs;
  },
  
  getNFTById: (id: string) => {
    return get().nfts.find(nft => nft.id === id);
  },
  
  toggleLike: (id: string) => {
    set(state => ({
      nfts: state.nfts.map(nft => 
        nft.id === id 
          ? { 
              ...nft, 
              isLiked: !nft.isLiked,
              likes: nft.isLiked ? nft.likes - 1 : nft.likes + 1 
            } 
          : nft
      )
    }));
  },
  
  searchNFTs: (query: string) => {
    const { nfts } = get();
    if (!query.trim()) return nfts;
    
    const lowerQuery = query.toLowerCase();
    
    return nfts.filter(nft => 
      nft.title.toLowerCase().includes(lowerQuery) ||
      nft.description.toLowerCase().includes(lowerQuery) ||
      nft.creator.name.toLowerCase().includes(lowerQuery) ||
      nft.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  },
  
  filterNFTs: (filters: NFTFilters) => {
    const { nfts } = get();
    let filtered = [...nfts];
    
    // Apply category filter
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(nft => nft.category === filters.category);
    }
    
    // Apply price filters
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(nft => nft.price >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(nft => nft.price <= filters.maxPrice!);
    }
    
    // Apply tag filters
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(nft => 
        filters.tags!.some(tag => nft.tags.includes(tag))
      );
    }
    
    // Apply sorting
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case "price_asc":
          filtered.sort((a, b) => a.price - b.price);
          break;
        case "price_desc":
          filtered.sort((a, b) => b.price - a.price);
          break;
        case "recent":
          filtered.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case "popular":
          filtered.sort((a, b) => b.likes - a.likes);
          break;
      }
    }
    
    return filtered;
  }
}));
