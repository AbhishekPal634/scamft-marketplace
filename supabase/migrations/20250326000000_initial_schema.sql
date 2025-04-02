-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the nfts table
CREATE TABLE IF NOT EXISTS nfts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price FLOAT8 NOT NULL,
  image_url TEXT NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  owner_id UUID REFERENCES auth.users(id),
  listed BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  editions_total INTEGER DEFAULT 1,
  editions_available INTEGER DEFAULT 1,
  category TEXT,
  tags TEXT[],
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the purchases table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  total_amount FLOAT8 NOT NULL,
  stripe_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the purchase_items table
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES purchases(id) NOT NULL,
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  quantity INTEGER NOT NULL,
  price_per_item FLOAT8 NOT NULL
);

-- Create the nft_history table
CREATE TABLE IF NOT EXISTS nft_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id UUID REFERENCES nfts(id) NOT NULL,
  previous_owner_id UUID REFERENCES auth.users(id),
  new_owner_id UUID REFERENCES auth.users(id) NOT NULL,
  price FLOAT8 NOT NULL,
  purchase_id UUID REFERENCES purchases(id),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nfts_creator_id ON nfts(creator_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner_id ON nfts(owner_id);
CREATE INDEX IF NOT EXISTS idx_nfts_listed ON nfts(listed);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase_id ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_nft_id ON purchase_items(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_history_nft_id ON nft_history(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_history_purchase_id ON nft_history(purchase_id);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- NFT policies
CREATE POLICY "NFTs are viewable by everyone"
ON nfts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create NFTs"
ON nfts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "NFT owners can update their NFTs"
ON nfts FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Purchase policies
CREATE POLICY "Users can view their own purchases"
ON purchases FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases"
ON purchases FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Purchase items policies
CREATE POLICY "Users can view their own purchase items"
ON purchase_items FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM purchases
  WHERE purchases.id = purchase_items.purchase_id
  AND purchases.user_id = auth.uid()
));

CREATE POLICY "Users can create their own purchase items"
ON purchase_items FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM purchases
  WHERE purchases.id = purchase_items.purchase_id
  AND purchases.user_id = auth.uid()
));

-- NFT history policies
CREATE POLICY "NFT history is viewable by everyone"
ON nft_history FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create NFT history"
ON nft_history FOR INSERT
TO authenticated
WITH CHECK (true); 