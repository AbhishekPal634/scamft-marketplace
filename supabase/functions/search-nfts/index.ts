
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
    const requestText = await req.text();
    let requestBody;
    
    try {
      // Safely parse the request body
      requestBody = requestText ? JSON.parse(requestText) : {};
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError, "Request text:", requestText);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { query, embedding, limit = 10 } = requestBody;

    console.log(`Search request received: ${query ? `query: ${query}` : "embedding search"}, limit: ${limit}`);

    if (!query && !embedding) {
      console.error("Missing query or embedding parameter");
      return new Response(
        JSON.stringify({ error: "Missing query or embedding parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Text search fallback function
    const performTextSearch = async () => {
      console.log("Performing text search");
      try {
        const { data: textSearchResults, error: textSearchError } = await supabase
          .from('nfts')
          .select('*')
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(limit);
        
        if (textSearchError) {
          console.error("Text search error:", textSearchError);
          throw new Error(`Text search failed: ${textSearchError.message}`);
        }
        
        console.log(`Text search found ${textSearchResults?.length || 0} results`);
        return textSearchResults || [];
      } catch (error) {
        console.error("Error in text search:", error);
        return [];
      }
    };

    // Fallback to text search if Gemini API key is not configured or if we encounter errors
    if (!geminiApiKey && query) {
      console.log("Gemini API key not configured, falling back to text search");
      const results = await performTextSearch();
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let queryEmbedding = embedding;

    // If we have a text query and no embedding, try to generate an embedding
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
          const errorText = await embeddingResponse.text();
          console.error("Gemini API error:", errorText);
          // Fall back to text search if embedding generation fails
          const results = await performTextSearch();
          return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const data = await embeddingResponse.json();
        if (!data.embedding || !data.embedding.values) {
          console.error("Invalid embedding response:", data);
          // Fall back to text search if embedding is invalid
          const results = await performTextSearch();
          return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        queryEmbedding = data.embedding.values;
        console.log("Embedding generated successfully");
      } catch (error) {
        console.error("Error generating embedding:", error);
        // Fall back to text search if embedding generation fails
        const results = await performTextSearch();
        return new Response(
          JSON.stringify({ results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If we have an embedding, try vector search
    if (queryEmbedding) {
      try {
        // Check if match_nfts function exists
        try {
          // Call the match_nfts function with the embedding
          console.log("Calling match_nfts function");
          const { data: nfts, error } = await supabase.rpc(
            'match_nfts',
            {
              query_embedding: queryEmbedding,
              match_threshold: 0.5,
              match_count: limit
            }
          );

          if (error) {
            console.error("Error calling match_nfts:", error);
            throw error;
          }

          console.log(`Vector search found ${nfts?.length || 0} results`);
          
          // If no results from vector search and we have a query, try text search
          if ((!nfts || nfts.length === 0) && query) {
            console.log("No vector search results, falling back to text search");
            const results = await performTextSearch();
            return new Response(
              JSON.stringify({ results }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          return new Response(
            JSON.stringify({ results: nfts || [] }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } catch (rpcError) {
          console.error("RPC error, match_nfts might not exist:", rpcError);
          throw rpcError;
        }
      } catch (error) {
        console.error("Vector search error:", error);
        // Fall back to text search if vector search fails and we have a query
        if (query) {
          console.log("Vector search failed, falling back to text search");
          const results = await performTextSearch();
          return new Response(
            JSON.stringify({ results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "Vector search failed", details: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (query) {
      // If we don't have an embedding but have a query, perform text search
      const results = await performTextSearch();
      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // This should never happen but just in case
    return new Response(
      JSON.stringify({ error: "Invalid search parameters" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error searching NFTs:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
