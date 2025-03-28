-- Add owner_id column to nfts table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'nfts' 
        AND column_name = 'owner_id'
    ) THEN 
        ALTER TABLE nfts ADD COLUMN owner_id UUID REFERENCES auth.users(id);
        
        -- Set default owner_id to creator_id for existing NFTs
        UPDATE nfts 
        SET owner_id = creator_id 
        WHERE owner_id IS NULL;
        
        -- Add an index to improve query performance
        CREATE INDEX IF NOT EXISTS idx_nfts_owner_id ON nfts (owner_id);
    END IF;
END $$;