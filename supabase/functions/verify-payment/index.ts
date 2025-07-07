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

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { session_id } = await req.json();
    if (!session_id) {
      throw new Error("Session ID is required");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      throw new Error("Session not found");
    }

    // Verify payment status
    const isPaymentSuccessful = session.payment_status === "paid";
    
    if (!isPaymentSuccessful) {
      return new Response(JSON.stringify({ 
        verified: false, 
        status: session.payment_status,
        message: "Payment not completed"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Validate user owns this session by checking metadata
    const sessionMetadata = session.metadata;
    if (!sessionMetadata?.renter_id) {
      throw new Error("Session metadata missing renter information");
    }

    // Verify the requesting user matches the session renter
    const { data: userProfile } = await supabaseService
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!userProfile || userProfile.id !== sessionMetadata.renter_id) {
      throw new Error("Unauthorized: Session does not belong to requesting user");
    }

    // Check if booking already exists for this session
    const { data: existingBooking, error: bookingCheckError } = await supabaseService
      .from('bookings')
      .select('*')
      .eq('stripe_payment_intent_id', session.payment_intent)
      .single();

    if (bookingCheckError && bookingCheckError.code !== 'PGRST116') {
      console.error("Error checking existing booking:", bookingCheckError);
    }

    return new Response(JSON.stringify({ 
      verified: true,
      payment_status: session.payment_status,
      amount: session.amount_total,
      booking_exists: !!existingBooking,
      booking_id: existingBooking?.id,
      session_metadata: session.metadata
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    
    // Sanitize error messages to prevent information leakage
    let clientMessage = "Payment verification failed";
    if (error.message.includes("Unauthorized")) {
      clientMessage = "Unauthorized access to payment session";
    } else if (error.message.includes("Session not found")) {
      clientMessage = "Payment session not found";
    }
    
    return new Response(JSON.stringify({ 
      verified: false,
      error: clientMessage
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});