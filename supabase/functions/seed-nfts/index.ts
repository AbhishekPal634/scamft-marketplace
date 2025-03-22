
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const BATCH_SIZE = 10; // Only process 10 NFTs at a time

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
        auth: {
          persistSession: false,
        },
        db: {
          schema: "public",
        },
      }
    );

    // Get the request body
    const { nfts, clearExisting, startIndex = 0, count = 10 } = await req.json();
    
    // If no NFTs are provided, return an error
    if (!nfts || !Array.isArray(nfts)) {
      throw new Error("No NFTs provided or invalid format");
    }
    
    // Limit the number of NFTs to process to 10
    const nftsToProcess = nfts.slice(startIndex, startIndex + count);
    
    if (nftsToProcess.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No more NFTs to process",
          startIndex,
          totalNFTs: nfts.length,
          processed: 0,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if we need to clear existing NFTs
    if (clearExisting) {
      console.log("Clearing existing NFTs...");
      const { error: deleteError } = await supabaseClient
        .from("nfts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Safety check to avoid deleting everything

      if (deleteError) {
        throw new Error(`Error clearing existing NFTs: ${deleteError.message}`);
      }
      console.log("Existing NFTs cleared successfully");
    }

    // Process NFTs in small batches of 10
    console.log(`Processing batch of ${nftsToProcess.length} NFTs starting at index ${startIndex}`);
    
    const { data, error } = await supabaseClient
      .from("nfts")
      .insert(nftsToProcess)
      .select();

    if (error) {
      throw new Error(`Error inserting NFTs: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully inserted ${data?.length || 0} NFTs`,
        data: data || [],
        startIndex,
        nextIndex: startIndex + count,
        totalNFTs: nfts.length,
        processed: nftsToProcess.length,
        remaining: Math.max(0, nfts.length - (startIndex + count)),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
