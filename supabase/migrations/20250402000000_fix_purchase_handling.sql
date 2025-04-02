-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_purchase_complete ON purchases;
DROP TRIGGER IF EXISTS on_nft_ownership_change ON nfts;

-- Create function to handle purchase completion
CREATE OR REPLACE FUNCTION handle_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if the purchase status is changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update NFT ownership and listing status for each item in the purchase
    UPDATE nfts
    SET 
      owner_id = NEW.user_id,
      listed = false,
      editions_available = 0
    WHERE id IN (
      SELECT nft_id 
      FROM purchase_items 
      WHERE purchase_id = NEW.id
    );

    -- Record NFT history for each item
    INSERT INTO nft_history (
      nft_id,
      previous_owner_id,
      new_owner_id,
      price,
      purchase_id
    )
    SELECT 
      pi.nft_id,
      n.owner_id,
      NEW.user_id,
      pi.price_per_item,
      NEW.id
    FROM purchase_items pi
    JOIN nfts n ON n.id = pi.nft_id
    WHERE pi.purchase_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase completion
CREATE TRIGGER on_purchase_complete
AFTER UPDATE ON purchases
FOR EACH ROW
EXECUTE FUNCTION handle_purchase_completion();

-- Create function to handle NFT ownership changes
CREATE OR REPLACE FUNCTION handle_nft_ownership_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record history if owner_id changes
  IF NEW.owner_id != OLD.owner_id THEN
    INSERT INTO nft_history (
      nft_id,
      previous_owner_id,
      new_owner_id,
      price,
      transaction_date
    )
    VALUES (
      NEW.id,
      OLD.owner_id,
      NEW.owner_id,
      NEW.price,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for NFT ownership changes
CREATE TRIGGER on_nft_ownership_change
AFTER UPDATE ON nfts
FOR EACH ROW
WHEN (NEW.owner_id IS DISTINCT FROM OLD.owner_id)
EXECUTE FUNCTION handle_nft_ownership_change();

-- Update RLS policies to allow system operations
CREATE POLICY "System can update NFT ownership"
ON nfts FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Add function to complete a purchase
CREATE OR REPLACE FUNCTION complete_purchase(purchase_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Update purchase status to completed
  UPDATE purchases
  SET status = 'completed'
  WHERE id = purchase_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_purchase TO authenticated;
GRANT EXECUTE ON FUNCTION handle_purchase_completion TO authenticated;
GRANT EXECUTE ON FUNCTION handle_nft_ownership_change TO authenticated; 