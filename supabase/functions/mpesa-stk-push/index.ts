import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MpesaSTKRequest {
  phone_number: string;
  amount: number;
  plan_type: "monthly" | "quarterly" | "yearly";
}

// Validate phone number format
function isValidPhoneNumber(phone: string): boolean {
  // Remove spaces and validate format
  const cleaned = phone.replace(/\s+/g, "");
  // Accept formats: +254XXXXXXXXX, 254XXXXXXXXX, 07XXXXXXXX, 01XXXXXXXX
  return /^(\+?254|0)[17]\d{8}$/.test(cleaned);
}

// Validate plan type
function isValidPlanType(plan: string): plan is "monthly" | "quarterly" | "yearly" {
  return ["monthly", "quarterly", "yearly"].includes(plan);
}

// Validate amount for plan type
function isValidAmount(amount: number, planType: string): boolean {
  const validAmounts: Record<string, number> = {
    monthly: 499,
    quarterly: 1299,
    yearly: 4499,
  };
  return validAmounts[planType] === amount;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Authenticate the request using the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token to verify identity
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use authenticated user's ID instead of client-provided user_id
    const authenticatedUserId = user.id;
    console.log("Authenticated user:", authenticatedUserId);

    // Parse and validate request body (user_id is NOT accepted from client)
    const requestBody = await req.json();
    const { phone_number, amount, plan_type } = requestBody as MpesaSTKRequest;

    // Input validation
    if (!phone_number || typeof phone_number !== "string") {
      return new Response(
        JSON.stringify({ error: "Valid phone number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!isValidPhoneNumber(phone_number)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format. Use format: 07XXXXXXXX or +254XXXXXXXXX" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan_type || !isValidPlanType(plan_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid plan type. Must be monthly, quarterly, or yearly" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount || typeof amount !== "number" || !isValidAmount(amount, plan_type)) {
      return new Response(
        JSON.stringify({ error: "Invalid amount for the selected plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("M-Pesa STK Push request:", { phone_number, amount, plan_type, user_id: authenticatedUserId });

    // Get M-Pesa credentials from environment
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const shortcode = Deno.env.get("MPESA_SHORTCODE") || "174379"; // Default sandbox shortcode

    if (!consumerKey || !consumerSecret || !passkey) {
      console.error("Missing M-Pesa credentials");
      return new Response(
        JSON.stringify({ error: "M-Pesa configuration incomplete" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase admin client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Get OAuth token from Safaricom
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
        },
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("OAuth token error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with M-Pesa" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log("Got M-Pesa access token");

    // Step 2: Generate timestamp and password
    const timestamp = new Date()
      .toISOString()
      .replace(/[^0-9]/g, "")
      .slice(0, 14);
    const password = btoa(`${shortcode}${passkey}${timestamp}`);

    // Format phone number (remove leading 0 or +254, add 254)
    let formattedPhone = phone_number.replace(/\s+/g, "");
    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    // Callback URL - use the Supabase function URL
    const callbackUrl = `${supabaseUrl}/functions/v1/mpesa-callback`;

    // Step 3: Initiate STK Push
    const stkPushPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: `HappyLearn-${plan_type}`,
      TransactionDesc: `HappyLearn ${plan_type} subscription`,
    };

    console.log("Sending STK Push:", JSON.stringify(stkPushPayload, null, 2));

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPushPayload),
      }
    );

    const stkData = await stkResponse.json();
    console.log("STK Push response:", JSON.stringify(stkData, null, 2));

    if (stkData.ResponseCode === "0") {
      // Create subscription record using authenticated user ID
      const { data: subscription, error: subError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: authenticatedUserId, // Use authenticated user ID
          plan_type,
          amount_kes: amount,
          payment_method: "mpesa",
          status: "pending",
        })
        .select()
        .single();

      if (subError) {
        console.error("Error creating subscription:", subError);
      }

      // Create payment transaction record
      const { error: txError } = await supabase.from("payment_transactions").insert({
        subscription_id: subscription?.id,
        user_id: authenticatedUserId, // Use authenticated user ID
        amount_kes: amount,
        payment_method: "mpesa",
        checkout_request_id: stkData.CheckoutRequestID,
        merchant_request_id: stkData.MerchantRequestID,
        phone_number: formattedPhone,
        status: "pending",
      });

      if (txError) {
        console.error("Error creating transaction:", txError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "STK Push sent successfully. Please check your phone.",
          checkout_request_id: stkData.CheckoutRequestID,
          merchant_request_id: stkData.MerchantRequestID,
          subscription_id: subscription?.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || "Failed to initiate payment",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("M-Pesa STK Push error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
