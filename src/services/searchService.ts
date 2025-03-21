
import { NFT, useNFTStore } from "./nftService";

// Simulated vector search using cosine similarity
export const searchByVector = (query: number[], nfts: NFT[], limit = 5): NFT[] => {
  // This is a simplified vector similarity search
  // In a real application, you would use a proper vector search library or API
  
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

// Search NFTs by text query
export const searchNFTsByText = async (query: string): Promise<NFT[]> => {
  // In a real application, you would:
  // 1. Send the text query to an API
  // 2. The API would convert the text to a vector embedding using an embedding model
  // 3. Perform a vector search against your database
  
  // For this demo, we'll use our simplified search function
  const store = useNFTStore.getState();
  
  // Simulate the process of converting text to vector embedding
  // In real-world, this would be done by an embedding model
  const simulatedQueryVector = generateSimulatedEmbedding(query);
  
  // Get all NFTs
  const allNFTs = store.nfts.length > 0 ? store.nfts : await store.fetchNFTs();
  
  return searchByVector(simulatedQueryVector, allNFTs, 10);
};

// Generate a simulated embedding vector from text
// This is just for demonstration - real embeddings would come from an ML model
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
