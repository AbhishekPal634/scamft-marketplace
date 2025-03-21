
import { NFT, useNFTStore } from "./nftService";

// This will be replaced with Supabase vector search
export const searchByVector = (query: number[], nfts: NFT[], limit = 5): NFT[] => {
  // This is a simplified vector similarity search
  // In a real application, you would use Supabase's pgvector extension
  
  if (!nfts.length || !query.length) return [];
  
  // Only process NFTs that have embeddings
  const nftsWithEmbeddings = nfts.filter(nft => nft.embedding && nft.embedding.length > 0);
  
  // Calculate cosine similarity between query vector and each NFT's embedding
  const nftsWithSimilarity = nftsWithEmbeddings.map(nft => {
    const similarity = cosineSimilarity(query, nft.embedding!);
    return { ...nft, similarity };
  });
  
  // Sort by similarity score (highest first) and return top results
  return nftsWithSimilarity
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, limit);
};

// Function to compute cosine similarity between two vectors
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  if (vecA.length !== vecB.length) {
    console.error("Vectors must have the same dimensions");
    return 0;
  }
  
  // Calculate dot product
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  // Calculate magnitudes
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  
  // Return cosine similarity
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
};

// Placeholder for Supabase vector search implementation
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  // TODO: Replace with actual Supabase vector search
  // For now, we're using the existing mock implementation
  const store = useNFTStore.getState();
  
  // Simulate the process of converting text to vector embedding
  // In real-world, this would be done by an embedding model through Supabase
  const simulatedQueryVector = generateSimulatedEmbedding(query);
  
  // Get all NFTs
  const allNFTs = store.nfts.length > 0 ? store.nfts : await store.fetchNFTs();
  
  return searchByVector(simulatedQueryVector, allNFTs, 10);
};

// Generate a simulated embedding vector from text
// This will be replaced by OpenAI embeddings via Supabase
const generateSimulatedEmbedding = (text: string): number[] => {
  // Simple hashing function to generate pseudo-random but deterministic values
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  };
  
  // Generate 5 pseudo-random values based on parts of the input text
  return [
    hashString(text),
    hashString(text + "a"),
    hashString(text + "b"),
    hashString(text + "c"),
    hashString(text + "d"),
  ];
};

// Find similar NFTs to a given NFT
export const findSimilarNFTs = async (nftId: string, limit = 4): Promise<NFT[]> => {
  const store = useNFTStore.getState();
  const nft = store.getNFTById(nftId);
  
  if (!nft || !nft.embedding) {
    return [];
  }
  
  // Get all NFTs except the current one
  const allNFTs = store.nfts.length > 0 
    ? store.nfts.filter(item => item.id !== nftId) 
    : (await store.fetchNFTs()).filter(item => item.id !== nftId);
  
  return searchByVector(nft.embedding, allNFTs, limit);
};

// Schema for implementing proper vector search with Supabase
/*
-- Create the nfts table
CREATE TABLE nfts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT NOT NULL,
  creator_id UUID REFERENCES profiles(id),
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  editions_total INTEGER DEFAULT 1,
  editions_available INTEGER DEFAULT 1,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  embedding VECTOR(1536) -- For OpenAI embeddings
);

-- Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT,
  avatar_url TEXT,
  email TEXT,
  bio TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the cart_items table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, nft_id)
);

-- Create the purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the purchase_items table
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) NOT NULL,
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_item DECIMAL(10, 2) NOT NULL
);

-- Create the function to search by embedding similarity
CREATE OR REPLACE FUNCTION search_nfts_by_embedding(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  image_url TEXT,
  creator_id UUID,
  category TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    nfts.id,
    nfts.title,
    nfts.description,
    nfts.price,
    nfts.image_url,
    nfts.creator_id,
    nfts.category,
    1 - (nfts.embedding <=> query_embedding) as similarity
  FROM nfts
  WHERE 1 - (nfts.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
*/
