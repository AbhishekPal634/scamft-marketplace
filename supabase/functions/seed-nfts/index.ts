import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

const BATCH_SIZE = 20; // Process NFTs in smaller batches to avoid timeout

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
      }
    );

    // Get the request body
    const { nfts, clearExisting } = await req.json();

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

    // Process NFTs in batches to avoid timeout
    const results = [];
    for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
      const batch = nfts.slice(i, i + BATCH_SIZE);
      console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(nfts.length / BATCH_SIZE)}`);
      
      const { data, error } = await supabaseClient
        .from("nfts")
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Error inserting NFTs (batch ${i / BATCH_SIZE + 1}): ${error.message}`);
      }

      results.push(...(data || []));
      console.log(`Batch ${i / BATCH_SIZE + 1} processed successfully`);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < nfts.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully inserted ${results.length} NFTs`,
        data: results,
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
