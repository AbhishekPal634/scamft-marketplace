import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.2.0?dts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const body = await req.json();
    const { items, userId, itemsMetadata, successUrl, cancelUrl } = body;

    if (!items || !items.length || !userId) {
      throw new Error("Missing required parameters");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Creating checkout session for user:", userId);
    console.log("Items:", JSON.stringify(items));

    // Calculate total amount
    const subtotal = items.reduce(
      (acc, item) => acc + item.nft.price * item.quantity,
      0
    );
    const serviceFee = subtotal * 0.025;
    const total = subtotal + serviceFee;

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: userId,
        total_amount: total,
        stripe_payment_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (purchaseError) {
      console.error("Error creating purchase record:", purchaseError);
      throw new Error("Failed to create purchase record");
    }

    console.log("Created purchase record:", purchase.id);

    // Create purchase items
    for (const item of items) {
      const { error: itemError } = await supabase
        .from("purchase_items")
        .insert({
          purchase_id: purchase.id,
          nft_id: item.nft.id,
          quantity: item.quantity,
          price_per_item: item.nft.price,
        });

      if (itemError) {
        console.error("Error creating purchase item:", itemError);
        throw new Error("Failed to create purchase items");
      }
    }

    // Format line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.nft.title,
          description: item.nft.description || "Digital NFT",
          images: [item.nft.image_url],
        },
        unit_amount: Math.round(item.nft.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add service fee
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Service Fee",
          description: "2.5% platform service fee",
        },
        unit_amount: Math.round(serviceFee * 100), // Convert to cents
      },
      quantity: 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${
        successUrl || req.headers.get("origin")
      }/profile?success=true&purchase_id=${purchase.id}`,
      cancel_url: `${
        cancelUrl || req.headers.get("origin")
      }/cart?canceled=true`,
      metadata: {
        userId: userId,
        purchaseId: purchase.id,
        items:
          itemsMetadata ||
          JSON.stringify(
            items.map((item) => ({
              id: item.nft.id,
              quantity: item.quantity,
              price: item.nft.price,
            }))
          ),
      },
    });

    console.log("Checkout session created:", session.id);

    // Update purchase with Stripe session ID
    const { error: updateError } = await supabase
      .from("purchases")
      .update({ stripe_payment_id: session.id })
      .eq("id", purchase.id);

    if (updateError) {
      console.error("Error updating purchase with Stripe ID:", updateError);
      throw new Error("Failed to update purchase record");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);

    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});
