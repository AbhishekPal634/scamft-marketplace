
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const geminiApiKey = Deno.env.get("GEMINI_API_KEY") || "";

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
    const requestBody = await req.json();
    const { query, embedding, limit = 10 } = requestBody;

    console.log(`Search request received: ${query ? `query: ${query}` : "embedding search"}, limit: ${limit}`);

    if (!query && !embedding) {
      console.error("Missing query or embedding parameter");
      return new Response(
        JSON.stringify({ error: "Missing query or embedding parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!geminiApiKey && query) {
      console.error("Gemini API key not configured");
      return new Response(
        JSON.stringify({ error: "Gemini API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let queryEmbedding = embedding;

    // If we have a text query and no embedding, generate an embedding
    if (query && !embedding) {
      try {
        console.log("Generating embedding for query:", query);
        const embeddingResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/embedding-001:embedContent?key=${geminiApiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "embedding-001",
            content: {
              parts: [{ text: query.substring(0, 8191) }] // Text limit
            }
          })
        });

        if (!embeddingResponse.ok) {
          const errorData = await embeddingResponse.json();
          console.error("Gemini API error:", JSON.stringify(errorData));
          throw new Error(`Gemini API error: ${JSON.stringify(errorData)}`);
        }

        const data = await embeddingResponse.json();
        queryEmbedding = data.embedding.values;
        console.log("Embedding generated successfully");
      } catch (error) {
        console.error("Error generating embedding:", error);
        
        // Fall back to text search if embedding generation fails
        try {
          console.log("Falling back to text search");
          const { data: textSearchResults, error: textSearchError } = await supabase
            .from('nfts')
            .select('*')
            .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
            .eq('listed', true)
            .limit(limit);
          
          if (textSearchError) throw textSearchError;
          
          console.log(`Text search found ${textSearchResults.length} results`);
          return new Response(
            JSON.stringify({ results: textSearchResults }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (fallbackError) {
          console.error("Fallback text search error:", fallbackError);
          return new Response(
            JSON.stringify({ error: "Search failed. Please try again later." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Call the match_nfts function with the embedding
    console.log("Calling match_nfts function");
    const { data: nfts, error } = await supabase.rpc(
      'match_nfts',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: limit * 2 // Get extra results to filter listed ones
      }
    );

    if (error) {
      console.error("Error calling match_nfts:", error);
      throw new Error(`Failed to search NFTs: ${error.message}`);
    }

    console.log(`Vector search found ${nfts.length} initial results`);

    // Filter results to only show NFTs that are listed for sale
    const { data: listedNftIds } = await supabase
      .from('nfts')
      .select('id')
      .eq('listed', true)
      .in('id', nfts.map(nft => nft.id));

    const listedIdSet = new Set(listedNftIds?.map(item => item.id) || []);
    const listedResults = nfts.filter(nft => listedIdSet.has(nft.id)).slice(0, limit);

    console.log(`Returning ${listedResults.length} final results`);
    return new Response(
      JSON.stringify({ results: listedResults }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error searching NFTs:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
