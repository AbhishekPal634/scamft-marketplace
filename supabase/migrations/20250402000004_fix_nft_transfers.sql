-- Drop the existing function
DROP FUNCTION IF EXISTS complete_purchase(UUID) CASCADE;

-- Create the fixed function
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
  WHERE id = purchase_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update purchase status
  UPDATE purchases
  SET 
    status = 'completed',
    updated_at = NOW()
  WHERE id = purchase_id;
  
  -- Process each item in the purchase
  FOR purchase_item IN
    SELECT pi.*, n.owner_id as current_owner_id
    FROM purchase_items pi
    JOIN nfts n ON n.id = pi.nft_id
    WHERE pi.purchase_id = purchase_id
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
    ) VALUES (
      purchase_item.nft_id,
      purchase_item.current_owner_id,
      purchase_record.user_id,
      purchase_id,
      purchase_item.price_per_item
    );
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION complete_purchase TO authenticated; 