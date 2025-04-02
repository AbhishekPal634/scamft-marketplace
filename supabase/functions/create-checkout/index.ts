
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@13.2.0?dts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const body = await req.json();
    const { items, userId, itemsMetadata, successUrl, cancelUrl } = body;

    if (!items || !items.length || !userId) {
      throw new Error('Missing required parameters');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Creating checkout session for user:', userId);
    console.log('Items:', JSON.stringify(items));

    // Format line items for Stripe
    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.nft.title,
          description: item.nft.description || 'Digital NFT',
          images: [item.nft.image_url],
        },
        unit_amount: Math.round(item.nft.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add 2.5% service fee
    const subtotal = items.reduce((acc, item) => acc + (item.nft.price * item.quantity), 0);
    const serviceFee = subtotal * 0.025;
    
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Service Fee',
          description: '2.5% platform service fee',
        },
        unit_amount: Math.round(serviceFee * 100), // Convert to cents
      },
      quantity: 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl || `${req.headers.get('origin')}/profile?success=true`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/cart?canceled=true`,
      metadata: {
        userId: userId,
        items: itemsMetadata || JSON.stringify(items.map(item => ({
          id: item.nft.id,
          quantity: item.quantity,
          price: item.nft.price
        }))),
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    );
  }
});
