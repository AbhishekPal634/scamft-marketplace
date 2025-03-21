
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

        // TODO: Handle purchase items and update NFT availability

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
