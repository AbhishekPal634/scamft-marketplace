
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
const huggingFaceToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize the Supabase client with the service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// NFT themes and styles for generation
const nftThemes = [
  "cosmic", "digital", "abstract", "futuristic", "cyberpunk", 
  "nature", "retro", "pixel", "vaporwave", "neon", 
  "geometric", "minimalist", "surreal", "psychedelic", "mystical",
  "underwater", "space", "steampunk", "fantasy", "dystopian"
];

const artStyles = [
  "digital art", "oil painting", "watercolor", "3D render", "pixel art",
  "concept art", "vector art", "illustration", "voxel art", "sketch",
  "photography", "abstract", "cubism", "surrealism", "impressionism"
];

// Predefined creator IDs based on the provided users
const creatorIds = [
  "4c293002-7f6f-427d-894b-1b7adcee1bf9",  // AbhiRockz
  "f5c2b1f2-be81-47f4-9ba6-01915b8e21c7"   // Abhishek Pal
];

// Generate random NFT data
function generateRandomNFT(index: number) {
  const theme = nftThemes[Math.floor(Math.random() * nftThemes.length)];
  const style = artStyles[Math.floor(Math.random() * artStyles.length)];
  const series = Math.floor(Math.random() * 10) + 1;
  
  const title = `${theme.charAt(0).toUpperCase() + theme.slice(1)} Dreams #${series}${index}`;
  
  const descriptions = [
    `A stunning ${style} exploration of ${theme} themes, capturing the essence of digital ownership in the NFT era.`,
    `Journey through a ${theme} landscape rendered in beautiful ${style}, pushing the boundaries of digital art.`,
    `This ${style} piece showcases a unique interpretation of ${theme} imagery, creating a one-of-a-kind digital collectible.`,
    `Immerse yourself in this ${theme} world created with exquisite ${style} techniques, perfect for NFT collectors.`,
    `A mesmerizing ${style} composition featuring intricate ${theme} elements, representing the future of digital assets.`
  ];
  
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  const tags = [theme, style, "digital", "collectible", "art"];
  if (Math.random() > 0.5) tags.push("rare");
  if (Math.random() > 0.7) tags.push("limited");
  
  const price = parseFloat((0.1 + Math.random() * 2).toFixed(2));
  
  const editions = {
    total: Math.floor(Math.random() * 20) + 1,
    available: Math.floor(Math.random() * 10) + 1
  };
  
  const categories = ["art", "photography", "music", "collectible", "video"];
  const category = categories[Math.floor(Math.random() * categories.length)];
  
  return {
    title,
    description,
    price,
    category: category as "art" | "photography" | "music" | "video" | "collectible",
    tags,
    editions,
    promptForImage: `${style} of ${theme} scene, digital nft artwork`
  };
}

// Generate embedding using Gemini API
async function generateEmbedding(text: string) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${geminiApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "embedding-001",
        content: { parts: [{ text: text.substring(0, 8191) }] }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Generate image using Hugging Face
async function generateImage(prompt: string, nftId: string) {
  try {
    console.log(`Generating image for NFT ${nftId} with prompt: ${prompt}`);
    
    const response = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${huggingFaceToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${errorText}`);
    }

    const imageBlob = await response.blob();
    const imageBytes = await imageBlob.arrayBuffer();
    const imageBuffer = new Uint8Array(imageBytes);

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filename = `nft-${timestamp}-${randomString}.png`;
    
    // Create a storage bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(bucket => bucket.name === 'nft-images')) {
      console.log("Creating nft-images bucket");
      await supabase.storage.createBucket('nft-images', {
        public: true
      });
    }
    
    // Upload the image to Supabase Storage
    console.log(`Uploading image for NFT ${nftId}`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('nft-images')
      .upload(`${nftId}/${filename}`, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = await supabase
      .storage
      .from('nft-images')
      .getPublicUrl(`${nftId}/${filename}`);

    console.log(`Image URL: ${publicUrlData.publicUrl}`);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { count = 10 } = await req.json();
    
    if (!geminiApiKey || !huggingFaceToken) {
      return new Response(
        JSON.stringify({ error: "API keys not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting to generate ${count} NFTs...`);
    
    // First, check if storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some(bucket => bucket.name === 'nft-images')) {
      console.log("Creating nft-images bucket");
      const { error } = await supabase.storage.createBucket('nft-images', {
        public: true
      });
      if (error) {
        console.error("Error creating bucket:", error);
        throw new Error(`Failed to create storage bucket: ${error.message}`);
      }
    }

    const results = [];
    const limit = Math.min(count, 10); // Cap at 10 NFTs
    
    for (let i = 0; i < limit; i++) {
      try {
        // Generate random NFT data
        const nftData = generateRandomNFT(i);
        
        // Generate a UUID for the NFT
        const nftId = crypto.randomUUID();
        
        // Select a random creator ID from our predefined list
        const creatorId = creatorIds[Math.floor(Math.random() * creatorIds.length)];
        
        console.log(`Generating NFT ${i+1}/${limit}: ${nftData.title} by creator ${creatorId}`);
        
        // Generate and upload image first
        console.log(`Generating image for NFT ${nftId}`);
        const imageUrl = await generateImage(nftData.promptForImage, nftId);
        
        // Generate text for embedding
        const textForEmbedding = [
          nftData.title,
          nftData.description,
          ...nftData.tags
        ].join(" ");
        
        // Generate embedding
        console.log(`Generating embedding for NFT ${nftId}`);
        const embedding = await generateEmbedding(textForEmbedding);
        
        // Insert NFT into database
        console.log(`Inserting NFT ${nftId} into database`);
        const { data: insertedNft, error: insertError } = await supabase
          .from('nfts')
          .insert([{
            id: nftId,
            title: nftData.title,
            description: nftData.description,
            price: nftData.price,
            creator_id: creatorId,
            image_url: imageUrl,
            category: nftData.category,
            tags: nftData.tags,
            embedding: embedding,
            editions_total: nftData.editions.total,
            editions_available: nftData.editions.available,
            likes: Math.floor(Math.random() * 200),
            views: Math.floor(Math.random() * 2000)
          }])
          .select();
        
        if (insertError) {
          console.error(`Error inserting NFT ${i}:`, insertError);
          throw new Error(`Failed to insert NFT: ${insertError.message}`);
        }
        
        results.push({
          id: nftId,
          title: nftData.title,
          imageUrl: imageUrl,
          creatorId: creatorId
        });
        
        console.log(`Successfully created NFT ${i+1}/${limit}`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (nftError) {
        console.error(`Error creating NFT ${i}:`, nftError);
        // Continue with the next NFT
      }
    }

    if (results.length === 0) {
      throw new Error("Failed to create any NFTs");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully generated ${results.length} NFTs`, 
        nfts: results 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating NFTs:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error", success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
