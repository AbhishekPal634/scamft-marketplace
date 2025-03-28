
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

// Initialize the Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle webhooks only for POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error("Missing Stripe API key or webhook secret");
      return new Response("Server configuration error", { status: 500 });
    }

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("No signature provided", { status: 400 });
    }

    // Initialize Stripe
    const stripe = new (await import("https://esm.sh/stripe@13.2.0")).default(stripeSecretKey);

    // Get the request body as text
    const body = await req.text();

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    // Handle specific Stripe events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.userId;
        
        console.log(`Processing checkout session: ${session.id} for user ${userId}`);
        
        // Create a purchase record in Supabase
        const { data: purchase, error: purchaseError } = await supabase
          .from("purchases")
          .insert({
            user_id: userId,
            total_amount: session.amount_total / 100, // Convert from cents to dollars
            stripe_payment_id: session.id,
            status: "completed",
          })
          .select();
        
        if (purchaseError) {
          console.error("Error recording purchase:", purchaseError);
          break;
        }

        const purchaseId = purchase[0].id;
        console.log(`Created purchase record with ID: ${purchaseId}`);
        
        // Handle purchase items from metadata
        if (session.metadata.items) {
          try {
            const items = JSON.parse(session.metadata.items);
            
            for (const item of items) {
              // Add item to purchase_items table
              const { error: itemError } = await supabase
                .from("purchase_items")
                .insert({
                  purchase_id: purchaseId,
                  nft_id: item.id,
                  quantity: item.quantity,
                  price_per_item: item.price
                });
                
              if (itemError) {
                console.error(`Error recording purchase item ${item.id}:`, itemError);
                continue;
              }
              
              // Get original NFT data before updating
              const { data: nftData, error: nftFetchError } = await supabase
                .from("nfts")
                .select("*")
                .eq("id", item.id)
                .single();
                
              if (nftFetchError) {
                console.error(`Error fetching NFT ${item.id}:`, nftFetchError);
                continue;
              }
              
              // Update the NFT to transfer ownership and remove from marketplace
              const { error: nftUpdateError } = await supabase
                .from("nfts")
                .update({ 
                  owner_id: userId,
                  listed: false, 
                  editions_available: 0 
                })
                .eq("id", item.id);
                
              if (nftUpdateError) {
                console.error(`Error updating NFT ${item.id}:`, nftUpdateError);
              } else {
                console.log(`Successfully transferred ownership of NFT ${item.id} to user ${userId}`);
                
                // Store the purchase history including original creator info
                if (nftData) {
                  const { error: historyError } = await supabase
                    .from("nft_history")
                    .insert({
                      nft_id: item.id,
                      previous_owner_id: nftData.owner_id || nftData.creator_id,
                      new_owner_id: userId,
                      purchase_id: purchaseId,
                      price: item.price,
                      transaction_date: new Date().toISOString()
                    });
                    
                  if (historyError) {
                    console.error(`Error recording NFT history for ${item.id}:`, historyError);
                  } else {
                    console.log(`Recorded purchase history for NFT ${item.id}`);
                  }
                }
              }
            }
          } catch (parseError) {
            console.error("Error parsing items from metadata:", parseError);
          }
        }

        console.log(`Payment successful: ${session.id} by user ${userId}`);
        break;
      }
      
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent ${paymentIntent.id} succeeded.`);
        break;
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling webhook:", error);
    return new Response(`Webhook Error: ${error.message}`, { status: 400 });
  }
});
