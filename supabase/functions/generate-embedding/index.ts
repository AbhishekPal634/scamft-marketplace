import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

// Initialize the Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate embedding using Gemini API
async function generateEmbedding(text: string) {
  try {
    console.log("Generating embedding for text:", text.substring(0, 100) + "...");
    
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
    
    // Process the embedding to ensure it's 384 dimensions
    let values = data.embedding.values;
    if (values.length > 384) {
      console.log(`Truncating embedding from ${values.length} to 384 dimensions`);
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nftId, title, description, tags = [] } = await req.json();
    
    if (!nftId) {
      throw new Error("NFT ID is required");
    }
    
    console.log(`Generating embedding for NFT ${nftId}`);
    
    // Combine all text fields for embedding generation
    const textForEmbedding = [
      title || "",
      description || "",
      ...(Array.isArray(tags) ? tags : [])
    ].filter(Boolean).join(" ");
    
    if (!textForEmbedding.trim()) {
      throw new Error("No text content available for embedding generation");
    }
    
    // Generate embedding
    const embedding = await generateEmbedding(textForEmbedding);
    
    if (!embedding) {
      throw new Error("Failed to generate embedding");
    }
    
    console.log(`Updating NFT ${nftId} with embedding (${embedding.length} dimensions)`);
    
    // Store embedding in database
    const { error: updateError } = await supabase
      .from("nfts")
      .update({ embedding })
      .eq("id", nftId);
    
    if (updateError) {
      throw new Error(`Failed to update NFT with embedding: ${updateError.message}`);
    }
    
    console.log(`Successfully updated NFT ${nftId} with embedding`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Embedding generated and stored successfully" 
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
    
  } catch (error) {
    console.error("Error processing embedding generation:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "An error occurred during embedding generation"
      }),
      { 
        status: 400, 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});