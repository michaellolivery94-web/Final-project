import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const PAYPAL_SECRET = Deno.env.get("PAYPAL_SECRET");
const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com"; // Use https://api-m.paypal.com for production

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

// Validate plan type
function isValidPlanType(plan: string): plan is "monthly" | "quarterly" | "yearly" {
  return ["monthly", "quarterly", "yearly"].includes(plan);
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
        JSON.stringify({ success: false, error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the authenticated user
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = user.id;
    console.log("Authenticated user:", authenticatedUserId);

    const { order_id, plan_type, amount_kes } = await req.json();

    // Input validation
    if (!order_id || typeof order_id !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Missing order ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!plan_type || !isValidPlanType(plan_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid plan type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Capturing PayPal order: ${order_id} for user ${authenticatedUserId}`);

    const accessToken = await getPayPalAccessToken();

    // Capture the order
    const captureResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${encodeURIComponent(order_id)}/capture`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureResponse.ok) {
      const error = await captureResponse.text();
      console.error("PayPal capture error:", error);
      throw new Error("Failed to capture PayPal payment");
    }

    const captureData = await captureResponse.json();
    console.log("PayPal capture result:", captureData.status);

    if (captureData.status !== "COMPLETED") {
      return new Response(
        JSON.stringify({ success: false, error: "Payment not completed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the transaction belongs to this user
    const { data: existingTransaction, error: txFindError } = await supabase
      .from("payment_transactions")
      .select("user_id")
      .eq("checkout_request_id", order_id)
      .single();

    if (txFindError || !existingTransaction) {
      console.error("Transaction not found:", txFindError);
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Security check: Ensure the transaction belongs to the authenticated user
    if (existingTransaction.user_id !== authenticatedUserId) {
      console.error(`SECURITY: User ${authenticatedUserId} attempted to capture transaction belonging to ${existingTransaction.user_id}`);
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized access to transaction" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate subscription dates
    const now = new Date();
    let expiresAt: Date;

    switch (plan_type) {
      case "monthly":
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case "quarterly":
        expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case "yearly":
        expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    // Get PayPal transaction ID
    const paypalTransactionId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    // Create subscription using authenticated user ID
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: authenticatedUserId, // Use authenticated user ID
        plan_type,
        status: "active",
        amount_kes: amount_kes || 0,
        payment_method: "paypal",
        transaction_id: paypalTransactionId,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (subError) {
      console.error("Subscription creation error:", subError);
      throw new Error("Failed to create subscription");
    }

    // Update payment transaction
    await supabase
      .from("payment_transactions")
      .update({
        status: "completed",
        result_code: "0",
        result_desc: "Payment successful",
        mpesa_receipt_number: paypalTransactionId,
        subscription_id: subscription.id,
      })
      .eq("checkout_request_id", order_id);

    console.log(`Subscription created: ${subscription.id}, expires: ${expiresAt.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PayPal capture error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
