
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize the Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { query } = await req.json();
    
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required and must be a string");
    }

    console.log(`Received search query: "${query}"`);
    
    // Perform a text search across multiple columns
    const { data: textResults, error: textError } = await supabase
      .from("nfts")
      .select(`
        id, 
        title, 
        description, 
        price, 
        image_url, 
        category,
        tags,
        creator_id,
        editions_total,
        editions_available,
        likes,
        views,
        listed,
        created_at,
        profiles:creator_id (
          username,
          full_name,
          avatar_url
        )
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('listed', true)
      .order('created_at', { ascending: false });
    
    if (textError) {
      console.error("Error during text search:", textError);
      throw textError;
    }

    // Process the results to have a more consistent format
    const processedResults = textResults.map(nft => ({
      id: nft.id,
      title: nft.title,
      description: nft.description,
      price: nft.price,
      image_url: nft.image_url,
      category: nft.category,
      tags: nft.tags,
      creator_id: nft.creator_id,
      creator_name: nft.profiles?.full_name || nft.profiles?.username || "Unknown Artist",
      creator_avatar: nft.profiles?.avatar_url || "/placeholder.svg",
      editions_total: nft.editions_total,
      editions_available: nft.editions_available,
      likes: nft.likes,
      views: nft.views,
      listed: nft.listed,
      created_at: nft.created_at
    }));

    console.log(`Returning ${processedResults.length} results`);
    
    // Return the search results with CORS headers
    return new Response(
      JSON.stringify({ 
        results: processedResults,
        count: processedResults.length
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
    
  } catch (error) {
    console.error("Error processing search request:", error);
    
    // Return a proper error response with CORS headers
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred during search",
        results: [] 
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
