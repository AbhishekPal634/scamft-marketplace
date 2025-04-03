import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";
const huggingFaceToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Initialize the Supabase client with the service role key to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// NFT themes and styles for generation
const nftThemes = [
  "cosmic",
  "digital",
  "abstract",
  "futuristic",
  "cyberpunk",
  "nature",
  "retro",
  "pixel",
  "vaporwave",
  "neon",
  "geometric",
  "minimalist",
  "surreal",
  "psychedelic",
  "mystical",
  "underwater",
  "space",
  "steampunk",
  "fantasy",
  "dystopian",
];

const artStyles = [
  "digital art",
  "oil painting",
  "watercolor",
  "3D render",
  "pixel art",
  "concept art",
  "vector art",
  "illustration",
  "voxel art",
  "sketch",
  "photography",
  "abstract",
  "cubism",
  "surrealism",
  "impressionism",
];

// Predefined creator IDs based on the provided users
const creatorIds = [
  "4c293002-7f6f-427d-894b-1b7adcee1bf9", // AbhiRockz
  "f5c2b1f2-be81-47f4-9ba6-01915b8e21c7", // Abhishek Pal
];

// Generate random NFT data
function generateRandomNFT(index: number) {
  const theme = nftThemes[Math.floor(Math.random() * nftThemes.length)];
  const style = artStyles[Math.floor(Math.random() * artStyles.length)];
  const series = Math.floor(Math.random() * 10) + 1;

  const titlePatterns = [
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Dreams #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Collection #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Series #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Edition #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Masterpiece #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Creation #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Artwork #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Piece #${series}${index}`,
    `${theme.charAt(0).toUpperCase() + theme.slice(1)} Work #${series}${index}`,
    `${
      theme.charAt(0).toUpperCase() + theme.slice(1)
    } Design #${series}${index}`,
  ];

  const title = titlePatterns[Math.floor(Math.random() * titlePatterns.length)];

  const descriptions = [
    `A stunning ${style} exploration of ${theme} themes, capturing the essence of digital ownership in the NFT era.`,
    `Journey through a ${theme} landscape rendered in beautiful ${style}, pushing the boundaries of digital art.`,
    `This ${style} piece showcases a unique interpretation of ${theme} imagery, creating a one-of-a-kind digital collectible.`,
    `Immerse yourself in this ${theme} world created with exquisite ${style} techniques, perfect for NFT collectors.`,
    `A mesmerizing ${style} composition featuring intricate ${theme} elements, representing the future of digital assets.`,
  ];

  const description =
    descriptions[Math.floor(Math.random() * descriptions.length)];

  const tags = [theme, style, "digital", "collectible", "art"];
  if (Math.random() > 0.5) tags.push("rare");
  if (Math.random() > 0.7) tags.push("limited");

  const price = Math.floor(Math.random() * 951) + 50; // Random integer between 50 and 1000

  const editions = {
    total: Math.floor(Math.random() * 20) + 1,
    available: 0, // Will be set equal to total
  };
  editions.available = editions.total; // Set available equal to total

  const categories = ["art", "photography", "music", "collectible", "video"];
  const category = categories[Math.floor(Math.random() * categories.length)];

  return {
    title,
    description,
    price,
    category: category as
      | "art"
      | "photography"
      | "music"
      | "video"
      | "collectible",
    tags,
    editions,
    promptForImage: `${style} of ${theme} scene, digital nft artwork`,
  };
}

// Generate embedding using Gemini API
async function generateEmbedding(text: string) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "embedding-001",
          content: { parts: [{ text: text.substring(0, 8191) }] },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // Process the embedding to ensure it's 384 dimensions
    // Take the first 384 dimensions if larger or pad with zeros if smaller
    let values = data.embedding.values;
    if (values.length > 384) {
      console.log(
        `Truncating embedding from ${values.length} to 384 dimensions`
      );
      values = values.slice(0, 384);
    } else if (values.length < 384) {
      console.log(`Padding embedding from ${values.length} to 384 dimensions`);
      values = [...values, ...Array(384 - values.length).fill(0)];
    }

    return values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
}

// Generate placeholder image URL based on theme
function getPlaceholderImageUrl(theme: string) {
  // Return a placeholder image based on the theme
  const baseUrl = "https://placehold.co/600x600/";

  // Different color schemes for different themes
  const themeColors = {
    cosmic: "000F42/FFFFFF",
    digital: "0B4F6C/FFFFFF",
    abstract: "845EC2/FFFFFF",
    futuristic: "4B4453/FFFFFF",
    cyberpunk: "FF2E63/FFFFFF",
    nature: "2C73D2/FFFFFF",
    retro: "FF9671/FFFFFF",
    pixel: "4D8076/FFFFFF",
    vaporwave: "C34A36/FFFFFF",
    neon: "00C9A7/FFFFFF",
    geometric: "4B4453/FFFFFF",
    minimalist: "3A3042/FFFFFF",
    surreal: "FF8066/FFFFFF",
    psychedelic: "D65DB1/FFFFFF",
    mystical: "361999/FFFFFF",
    underwater: "1B9AAA/FFFFFF",
    space: "0F111A/FFFFFF",
    steampunk: "AA8976/FFFFFF",
    fantasy: "9B89B3/FFFFFF",
    dystopian: "4A4238/FFFFFF",
  };

  // Get the color for the theme or use a default
  const colorScheme =
    themeColors[theme as keyof typeof themeColors] || "222222/FFFFFF";

  // Return the placeholder URL with the theme name
  return `${baseUrl}${colorScheme}?text=${theme.toUpperCase()}`;
}

// Generate image using Hugging Face
async function generateImage(prompt: string, nftId: string, theme: string) {
  try {
    console.log(`Generating image for NFT ${nftId} with prompt: ${prompt}`);

    // Try to get image from Hugging Face API
    try {
      const response = await fetch(
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${huggingFaceToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
          // Add a timeout to prevent hanging on API issues
          signal: AbortSignal.timeout(15000), // 15 second timeout
        }
      );

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

      // Upload the image to Supabase Storage
      console.log(`Uploading HF-generated image for NFT ${nftId}`);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("nft-images")
        .upload(`${nftId}/${filename}`, imageBuffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: publicUrlData } = await supabase.storage
        .from("nft-images")
        .getPublicUrl(`${nftId}/${filename}`);

      console.log(`Image URL: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } catch (huggingFaceError) {
      console.error("Hugging Face API error:", huggingFaceError);
      console.log("Falling back to placeholder image...");

      // If Hugging Face fails, use a placeholder image
      const placeholderUrl = getPlaceholderImageUrl(theme);
      console.log(`Using placeholder image: ${placeholderUrl}`);

      // If you want to store the placeholder as a local file in Supabase Storage
      try {
        // Fetch the placeholder image
        const placeholderResponse = await fetch(placeholderUrl);
        if (!placeholderResponse.ok) {
          throw new Error(
            `Failed to fetch placeholder image: ${placeholderResponse.statusText}`
          );
        }

        const placeholderBlob = await placeholderResponse.blob();
        const placeholderBytes = await placeholderBlob.arrayBuffer();
        const placeholderBuffer = new Uint8Array(placeholderBytes);

        // Generate a unique filename for the placeholder
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 10);
        const filename = `placeholder-${timestamp}-${randomString}.png`;

        // Upload the placeholder to Supabase Storage
        console.log(`Uploading placeholder image for NFT ${nftId}`);
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("nft-images")
          .upload(`${nftId}/${filename}`, placeholderBuffer, {
            contentType: "image/png",
            upsert: true,
          });

        if (uploadError) {
          console.error("Error uploading placeholder:", uploadError);
          // Return the placeholder URL directly if upload fails
          return placeholderUrl;
        }

        // Get the public URL for the uploaded placeholder
        const { data: publicUrlData } = await supabase.storage
          .from("nft-images")
          .getPublicUrl(`${nftId}/${filename}`);

        console.log(`Placeholder URL: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
      } catch (placeholderError) {
        console.error("Error processing placeholder:", placeholderError);
        // Return the placeholder URL directly in case of any error
        return placeholderUrl;
      }
    }
  } catch (error) {
    console.error("Error in image generation:", error);
    // Return a fallback URL if everything fails
    return `https://placehold.co/600x600/333/FFF?text=NFT+${nftId.slice(0, 8)}`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { count = 10 } = await req.json();

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Starting to generate ${count} NFTs...`);

    // First, check if storage bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((bucket) => bucket.name === "nft-images")) {
      console.log("Creating nft-images bucket");
      const { error } = await supabase.storage.createBucket("nft-images", {
        public: true,
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
        const creatorId =
          creatorIds[Math.floor(Math.random() * creatorIds.length)];

        console.log(
          `Generating NFT ${i + 1}/${limit}: ${
            nftData.title
          } by creator ${creatorId}`
        );

        // Generate and upload image first - pass the theme for placeholders
        console.log(`Generating image for NFT ${nftId}`);
        const randomTheme =
          nftData.tags.find((tag) => nftThemes.includes(tag)) || "digital";
        const imageUrl = await generateImage(
          nftData.promptForImage,
          nftId,
          randomTheme
        );

        // Generate text for embedding
        const textForEmbedding = [
          nftData.title,
          nftData.description,
          ...nftData.tags,
        ].join(" ");

        // Generate embedding
        console.log(`Generating embedding for NFT ${nftId}`);
        const embedding = await generateEmbedding(textForEmbedding);

        // Insert NFT into database
        console.log(`Inserting NFT ${nftId} into database`);
        const { data: insertedNft, error: insertError } = await supabase
          .from("nfts")
          .insert([
            {
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
              views: Math.floor(Math.random() * 2000),
            },
          ])
          .select();

        if (insertError) {
          console.error(`Error inserting NFT ${i}:`, insertError);
          throw new Error(`Failed to insert NFT: ${insertError.message}`);
        }

        results.push({
          id: nftId,
          title: nftData.title,
          imageUrl: imageUrl,
          creatorId: creatorId,
        });

        console.log(`Successfully created NFT ${i + 1}/${limit}`);

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
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
        nfts: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating NFTs:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
