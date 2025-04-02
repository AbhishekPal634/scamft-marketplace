-- Drop existing tables and functions in correct order
DROP FUNCTION IF EXISTS complete_purchase(UUID) CASCADE;
DROP FUNCTION IF EXISTS handle_purchase_completion() CASCADE;
DROP FUNCTION IF EXISTS handle_nft_ownership_change() CASCADE;
DROP TRIGGER IF EXISTS on_purchase_complete ON purchases CASCADE;
DROP TRIGGER IF EXISTS on_nft_ownership_change ON nfts CASCADE;
DROP TABLE IF EXISTS nft_history CASCADE;
DROP TABLE IF EXISTS purchase_items CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS nft_transfers CASCADE;

-- Create new purchases table
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount FLOAT8 NOT NULL, 
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create new purchase_items table
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_item FLOAT8 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create new nft_transfers table (simpler than nft_history)
CREATE TABLE nft_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  from_user_id UUID REFERENCES auth.users(id),
  to_user_id UUID REFERENCES auth.users(id) NOT NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
  price FLOAT8 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_nft_id ON purchase_items(nft_id);
CREATE INDEX idx_nft_transfers_nft_id ON nft_transfers(nft_id);
CREATE INDEX idx_nft_transfers_purchase_id ON nft_transfers(purchase_id);

-- Enable RLS
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own purchases"
ON purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update purchases"
ON purchases FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view their own purchase items"
ON purchase_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM purchases
  WHERE purchases.id = purchase_items.purchase_id
  AND purchases.user_id = auth.uid()
));

CREATE POLICY "System can create purchase items"
ON purchase_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "NFT transfers are viewable by everyone"
ON nft_transfers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create NFT transfers"
ON nft_transfers FOR INSERT
TO authenticated
WITH CHECK (true);

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "System can update NFTs during purchase" ON nfts;

-- Add policy to allow system to update NFTs during purchase completion
CREATE POLICY "System can update NFTs during purchase"
ON nfts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to complete a purchase
CREATE OR REPLACE FUNCTION complete_purchase(purchase_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  purchase_record RECORD;
  purchase_item RECORD;
  new_editions_available INTEGER;
BEGIN
  -- Get purchase details
  SELECT * INTO purchase_record
  FROM purchases
  WHERE id = purchase_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Process each item in the purchase
  FOR purchase_item IN
    SELECT * FROM purchase_items WHERE purchase_id = purchase_id
  LOOP
    -- Get current editions_available
    SELECT editions_available INTO new_editions_available
    FROM nfts
    WHERE id = purchase_item.nft_id;
    
    -- Calculate new editions_available
    new_editions_available := new_editions_available - purchase_item.quantity;
    
    -- Update NFT ownership and listing status
    UPDATE nfts
    SET 
      owner_id = purchase_record.user_id,
      listed = CASE WHEN new_editions_available <= 0 THEN false ELSE true END,
      editions_available = new_editions_available,
      updated_at = NOW()
    WHERE id = purchase_item.nft_id;
    
    -- Record the transfer
    INSERT INTO nft_transfers (
      nft_id,
      from_user_id,
      to_user_id,
      purchase_id,
      price
    )
    SELECT 
      purchase_item.nft_id,
      n.owner_id,
      purchase_record.user_id,
      purchase_id,
      purchase_item.price_per_item
    FROM nfts n
    WHERE n.id = purchase_item.nft_id;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_purchase TO authenticated; 