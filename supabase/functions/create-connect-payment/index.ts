import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingRequest {
  listingId: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  bookingType: 'daily' | 'weekly';
}

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

    // Get booking details from request
    const bookingData: BookingRequest = await req.json();
    const { listingId, startDate, endDate, totalAmount, bookingType } = bookingData;

    // Enhanced input validation
    if (!listingId || !startDate || !endDate || !totalAmount || !bookingType) {
      throw new Error("Missing required booking parameters");
    }

    // Validate UUID format for listingId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(listingId)) {
      throw new Error("Invalid listing ID format");
    }

    // Validate amount is positive and reasonable (max $10,000)
    if (totalAmount <= 0 || totalAmount > 1000000) {
      throw new Error("Invalid total amount");
    }

    // Validate date format and range
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const now = new Date();
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error("Invalid date format");
    }

    if (startDateObj >= endDateObj) {
      throw new Error("Start date must be before end date");
    }

    if (startDateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      throw new Error("Start date cannot be in the past");
    }

    // Validate booking type
    if (!['daily', 'weekly'].includes(bookingType)) {
      throw new Error("Invalid booking type");
    }

    // Validate booking duration (max 365 days)
    const durationMs = endDateObj.getTime() - startDateObj.getTime();
    const maxDurationMs = 365 * 24 * 60 * 60 * 1000;
    if (durationMs > maxDurationMs) {
      throw new Error("Booking duration cannot exceed 365 days");
    }

    // Get listing and salon owner details
    const { data: listing, error: listingError } = await supabaseService
      .from('listings')
      .select(`
        *,
        profiles!listings_owner_id_fkey(
          stripe_connect_account_id,
          stripe_connect_onboarded,
          full_name
        )
      `)
      .eq('id', listingId)
      .single();

    if (listingError || !listing) throw new Error("Listing not found");

    // Verify listing is available
    if (!listing.available) {
      throw new Error("Listing is not available for booking");
    }

    // Calculate expected amount and verify against provided amount
    const dailyRate = listing.price_per_day;
    const weeklyRate = listing.price_per_week;
    const duration = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    let expectedAmount: number;
    if (bookingType === 'weekly' && weeklyRate && duration >= 7) {
      const weeks = Math.floor(duration / 7);
      const remainingDays = duration % 7;
      expectedAmount = (weeks * weeklyRate) + (remainingDays * dailyRate);
    } else {
      expectedAmount = duration * dailyRate;
    }

    // Allow 1% tolerance for rounding differences
    const tolerance = Math.max(1, Math.floor(expectedAmount * 0.01));
    if (Math.abs(totalAmount - expectedAmount) > tolerance) {
      throw new Error(`Amount mismatch: expected ${expectedAmount}, received ${totalAmount}`);
    }

    const salonOwner = listing.profiles;
    if (!salonOwner.stripe_connect_onboarded || !salonOwner.stripe_connect_account_id) {
      throw new Error("Salon owner has not completed Stripe onboarding");
    }

    // Get renter profile
    const { data: renterProfile, error: renterError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (renterError) throw new Error("Renter profile not found");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Calculate platform fee (10%)
    const platformFeeAmount = Math.round(totalAmount * 0.10);
    const salonOwnerAmount = totalAmount - platformFeeAmount;

    // Create payment intent with Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      application_fee_amount: platformFeeAmount,
      transfer_data: {
        destination: salonOwner.stripe_connect_account_id,
      },
      metadata: {
        listing_id: listingId,
        renter_id: renterProfile.id,
        start_date: startDate,
        end_date: endDate,
        booking_type: bookingType,
        platform_fee: platformFeeAmount.toString(),
        salon_owner_amount: salonOwnerAmount.toString(),
      },
    });

    // Create Stripe Checkout session
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      payment_intent_data: {
        application_fee_amount: platformFeeAmount,
        transfer_data: {
          destination: salonOwner.stripe_connect_account_id,
        },
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              description: `${bookingType} rental from ${startDate} to ${endDate}`,
              images: listing.images ? [listing.images[0]] : [],
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/listing/${listingId}`,
      metadata: {
        listing_id: listingId,
        renter_id: renterProfile.id,
        start_date: startDate,
        end_date: endDate,
        booking_type: bookingType,
      },
    });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-connect-payment:", error);
    
    // Sanitize error messages for client
    let clientMessage = "Payment creation failed";
    if (error.message.includes("not found")) {
      clientMessage = "Requested resource not found";
    } else if (error.message.includes("Invalid")) {
      clientMessage = error.message; // Safe to show validation errors
    } else if (error.message.includes("not completed")) {
      clientMessage = "Payment setup not completed";
    }
    
    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});