
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const huggingFaceToken = Deno.env.get("HUGGING_FACE_ACCESS_TOKEN") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request data
    const { prompt, nftId } = await req.json();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Missing prompt parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!huggingFaceToken) {
      return new Response(
        JSON.stringify({ error: "Hugging Face access token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate image using Hugging Face API with FLUX.1-schnell model
    const imageResponse = await fetch("https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${huggingFaceToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt
      })
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`Hugging Face API error: ${errorText}`);
    }

    // Convert image to blob and then to base64
    const imageBlob = await imageResponse.blob();
    const imageBytes = await imageBlob.arrayBuffer();
    const imageBuffer = new Uint8Array(imageBytes);

    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const filename = `nft-${timestamp}-${randomString}.png`;
    const filePath = `${nftId}/${filename}`;

    // Upload the image to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('nft-images')
      .upload(filePath, imageBuffer, {
        contentType: 'image/png'
      });

    if (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = await supabase
      .storage
      .from('nft-images')
      .getPublicUrl(filePath);

    const imageUrl = publicUrlData.publicUrl;

    // Update the NFT with the image URL if nftId was provided
    if (nftId) {
      const { error: updateError } = await supabase
        .from("nfts")
        .update({ image_url: imageUrl })
        .eq("id", nftId);

      if (updateError) {
        throw new Error(`Failed to update NFT: ${updateError.message}`);
      }
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating NFT image:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
