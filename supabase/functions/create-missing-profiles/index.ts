import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create default profiles for known creator IDs
    const defaultProfiles = [
      {
        id: "4c293002-7f6f-427d-894b-1b7adcee1bf9",
        full_name: "AbhiRockz",
        username: "abhirockz",
        avatar_url: "/placeholder.svg"
      },
      {
        id: "f5c2b1f2-be81-47f4-9ba6-01915b8e21c7",
        full_name: "NFT Artist",
        username: "nftartist",
        avatar_url: "/placeholder.svg"
      }
    ];

    const results = [];

    for (const profile of defaultProfiles) {
      // Check if profile already exists
      const { data: existingProfile } = await supabaseClient
        .from('profiles')
        .select()
        .eq('id', profile.id)
        .single();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { data, error } = await supabaseClient
          .from('profiles')
          .insert([profile])
          .select();

        if (error) {
          console.error(`Error creating profile for ${profile.id}:`, error);
          results.push({ id: profile.id, success: false, error: error.message });
        } else {
          console.log(`Created profile for ${profile.id}`);
          results.push({ id: profile.id, success: true, profile: data[0] });
        }
      } else {
        console.log(`Profile already exists for ${profile.id}`);
        results.push({ id: profile.id, success: true, profile: existingProfile });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Profile creation complete",
        results
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});