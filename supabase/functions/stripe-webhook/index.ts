import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No stripe signature found");
      return new Response("No signature", { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      if (!webhookSecret) {
        console.error("STRIPE_WEBHOOK_SECRET not configured");
        return new Response("Webhook not configured", { status: 500 });
      }
      
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response("Invalid signature", { status: 400 });
    }

    console.log("Processing webhook event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("Processing completed checkout session:", session.id);
      
      // Extract metadata from the session
      const metadata = session.metadata;
      if (!metadata) {
        console.error("No metadata found in session");
        return new Response("No metadata", { status: 400 });
      }

      const { listing_id, renter_id, start_date, end_date, booking_type } = metadata;
      
      if (!listing_id || !renter_id || !start_date || !end_date || !booking_type) {
        console.error("Missing required metadata:", metadata);
        return new Response("Missing metadata", { status: 400 });
      }

      // Verify the payment was successful
      if (session.payment_status !== "paid") {
        console.error("Payment not completed:", session.payment_status);
        return new Response("Payment not completed", { status: 400 });
      }

      // Check if booking already exists to prevent duplicates
      const { data: existingBooking } = await supabaseService
        .from('bookings')
        .select('id')
        .eq('stripe_payment_intent_id', session.payment_intent as string)
        .single();

      if (existingBooking) {
        console.log("Booking already exists for payment intent:", session.payment_intent);
        return new Response(JSON.stringify({ success: true, booking_id: existingBooking.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Validate booking data
      if (!listing_id || !renter_id || !start_date || !end_date) {
        console.error("Invalid booking data:", { listing_id, renter_id, start_date, end_date });
        return new Response("Invalid booking data", { status: 400 });
      }

      // Validate dates
      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      if (startDateObj >= endDateObj || startDateObj < new Date()) {
        console.error("Invalid date range:", { start_date, end_date });
        return new Response("Invalid date range", { status: 400 });
      }

      // Create the booking record
      const { data: booking, error: bookingError } = await supabaseService
        .from('bookings')
        .insert({
          listing_id,
          renter_id,
          start_date,
          end_date,
          booking_type,
          total_amount: session.amount_total || 0,
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent as string,
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Error creating booking:", bookingError);
        return new Response("Booking creation failed", { status: 500 });
      }

      console.log("Booking created successfully:", booking.id);

      // Update listing availability if needed
      // Note: You might want to implement availability blocking logic here
      
      return new Response(JSON.stringify({ success: true, booking_id: booking.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Handle other webhook events if needed
    console.log("Unhandled webhook event type:", event.type);
    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});