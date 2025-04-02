-- Add editions_total column if it doesn't exist
ALTER TABLE nfts 
ADD COLUMN IF NOT EXISTS editions_total INTEGER DEFAULT 1;

-- Update all rows with random edition counts between 1 and 10
UPDATE nfts 
SET 
    editions_total = FLOOR(RANDOM() * 10 + 1),
    editions_available = editions_total
WHERE editions_total IS NULL OR editions_available IS NULL; 