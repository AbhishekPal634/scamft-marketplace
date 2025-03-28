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

// Generate embedding using Gemini API - same function used in seed-nfts
async function generateEmbedding(text: string) {
  try {
    if (!geminiApiKey) {
      console.log("No Gemini API key available, skipping embedding generation");
      throw new Error("Gemini API key not configured");
    }
    
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
    // Take the first 384 dimensions if larger or pad with zeros if smaller
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
    // Check if request has a body
    if (req.body === null) {
      throw new Error("Request body is missing");
    }

    let requestData;
    try {
      // Parse the request body with more robust error handling
      const text = await req.text();
      if (!text || text.trim() === '') {
        throw new Error("Request body is empty");
      }
      requestData = JSON.parse(text);
      console.log("Request body parsed successfully:", requestData);
    } catch (jsonError) {
      console.error("Failed to parse JSON:", jsonError);
      throw new Error(`Invalid JSON in request body: ${jsonError.message}`);
    }

    const { query, limit = 20 } = requestData;
    
    console.log(`Processing search request: ${JSON.stringify(requestData)}`);
    
    // Check if we have a valid query string
    if (!query || typeof query !== "string") {
      throw new Error("Search query is required and must be a string");
    }
    
    let results = [];

    // First try simple text search to ensure we get some results
    console.log(`Performing text search for: "${query}"`);
    
    // Perform a text search prioritizing title matches
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
        owner_id,
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
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
      .eq('listed', true)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (textError) {
      console.error("Error during text search:", textError);
      throw textError;
    }
    
    results = textResults || [];
    
    // Try vector search if text search didn't find many results and we have the Gemini API key
    if (geminiApiKey && results.length < 5) {
      try {
        console.log(`Generating embedding for search query: "${query}"`);
        const queryEmbedding = await generateEmbedding(query);
        
        console.log(`Performing vector search for: "${query}"`);
        
        try {
          const { data: vectorResults, error: vectorError } = await supabase.rpc(
            'match_nfts', 
            { 
              query_embedding: queryEmbedding,  // Pass the array directly
              match_threshold: 0.4,  // Adjust threshold to be more permissive
              match_count: limit 
            }
          );
          
          if (vectorError) {
            console.error("Vector search error:", vectorError);
          } else if (vectorResults && vectorResults.length > 0) {
            console.log(`Vector search returned ${vectorResults.length} results`);
            
            // Get full details for the vector search results
            const ids = vectorResults.map(res => res.id);
            const { data: fullResults, error: detailsError } = await supabase
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
                owner_id,
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
              .in('id', ids)
              .eq('listed', true);
              
            if (!detailsError && fullResults && fullResults.length > 0) {
              // Sort results to match the original vector search order (by similarity)
              const vectorSearchResults = fullResults.sort((a, b) => {
                const aIndex = ids.indexOf(a.id);
                const bIndex = ids.indexOf(b.id);
                return aIndex - bIndex;
              });
              
              // Merge the results - put vector results first
              const seenIds = new Set(results.map(item => item.id));
              const uniqueVectorResults = vectorSearchResults.filter(item => !seenIds.has(item.id));
              
              results = [...uniqueVectorResults, ...results];
              results = results.slice(0, limit); // Limit the total results
            }
          } else {
            console.log("No vector search results found");
          }
        } catch (rpcError) {
          console.error("Error calling match_nfts RPC:", rpcError);
        }
      } catch (vectorSearchError) {
        console.error("Error during vector search:", vectorSearchError);
      }
    } else if (!geminiApiKey) {
      console.log("No Gemini API key available, skipping vector search");
    }

    if (results.length === 0) {
      console.log("No search results found");
    }

    // Process the results to have a more consistent format
    const processedResults = results.map(nft => ({
      id: nft.id,
      title: nft.title,
      description: nft.description,
      price: nft.price,
      image_url: nft.image_url,
      category: nft.category,
      tags: nft.tags,
      creator_id: nft.creator_id,
      owner_id: nft.owner_id,
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
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
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
        status: 200, // Return 200 even for errors to avoid client-side error handling issues
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        } 
      }
    );
  }
});
