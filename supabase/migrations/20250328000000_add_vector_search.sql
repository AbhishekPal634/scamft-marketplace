-- Enable the pgvector extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Drop existing functions if they exist to avoid return type conflicts
DO $$
BEGIN
  -- Drop match_nfts if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'match_nfts' 
    AND pronargs = 3
  ) THEN
    DROP FUNCTION match_nfts(vector(384), float, int);
  END IF;
  
  -- Drop find_similar_nfts if it exists
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'find_similar_nfts' 
    AND pronargs = 2
  ) THEN
    DROP FUNCTION find_similar_nfts(uuid, int);
  END IF;
END
$$;

-- Create a function to match NFTs by vector similarity
CREATE FUNCTION match_nfts(query_embedding vector(384), match_threshold float, match_count int)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price float8,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.description,
    n.price,
    n.image_url,
    1 - (n.embedding::vector(384) <=> query_embedding) AS similarity
  FROM nfts n
  WHERE
    n.embedding IS NOT NULL
    AND n.listed = true
    AND 1 - (n.embedding::vector(384) <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Drop the previous index if it exists
DROP INDEX IF EXISTS nfts_embedding_idx;

-- Create a proper index for vector search using the ivfflat index method
-- Note: We're using a simpler approach since the embedding is already stored correctly
CREATE INDEX IF NOT EXISTS nfts_embedding_idx ON nfts
USING ivfflat ((embedding::vector(384)) vector_cosine_ops)
WITH (lists = 100);

-- Create a function to find similar NFTs based on vector similarity
CREATE FUNCTION find_similar_nfts(nft_id uuid, match_count int)
RETURNS TABLE (
  id uuid,
  title text,
  price float8,
  image_url text,
  similarity float
)
LANGUAGE plpgsql
AS $$
DECLARE
  nft_embedding vector(384);
BEGIN
  -- Get the embedding of the specified NFT
  SELECT embedding::vector(384) INTO nft_embedding 
  FROM nfts 
  WHERE id = nft_id;
  
  -- If no embedding found, return empty result
  IF nft_embedding IS NULL THEN
    RETURN;
  END IF;
  
  -- Return NFTs with similar embeddings
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.price,
    n.image_url,
    1 - (n.embedding::vector(384) <=> nft_embedding) AS similarity
  FROM nfts n
  WHERE
    n.id <> nft_id  -- Exclude the original NFT
    AND n.embedding IS NOT NULL 
    AND n.listed = true
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;