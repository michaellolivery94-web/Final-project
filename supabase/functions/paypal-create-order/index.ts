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
    const error = await response.text();
    console.error("PayPal auth error:", error);
    throw new Error("Failed to authenticate with PayPal");
  }

  const data = await response.json();
  return data.access_token;
}

// Validate plan type
function isValidPlanType(plan: string): plan is "monthly" | "quarterly" | "yearly" {
  return ["monthly", "quarterly", "yearly"].includes(plan);
}

// Validate amount for plan type
function isValidAmount(amount: number, planType: string): boolean {
  const validAmounts: Record<string, number> = {
    monthly: 249,
    quarterly: 599,
    yearly: 1799,
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

    const { plan_type, amount_kes, return_url, cancel_url } = await req.json();

    // Input validation
    if (!plan_type || !isValidPlanType(plan_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid plan type. Must be monthly, quarterly, or yearly" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!amount_kes || typeof amount_kes !== "number" || !isValidAmount(amount_kes, plan_type)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid amount for the selected plan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert KES to USD (approximate rate - in production use a live rate)
    const KES_TO_USD_RATE = 0.0065; // ~1 USD = 154 KES
    const amountUsd = (amount_kes * KES_TO_USD_RATE).toFixed(2);

    console.log(`Creating PayPal order: ${plan_type}, KES ${amount_kes} -> USD ${amountUsd}`);

    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `${authenticatedUserId}_${plan_type}_${Date.now()}`,
            description: `HappyLearn Premium - ${plan_type} plan`,
            amount: {
              currency_code: "USD",
              value: amountUsd,
            },
          },
        ],
        application_context: {
          brand_name: "HappyLearn",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: return_url || "https://happylearn.app/pricing?payment=success",
          cancel_url: cancel_url || "https://happylearn.app/pricing?payment=cancelled",
        },
      }),
    });

    if (!orderResponse.ok) {
      const error = await orderResponse.text();
      console.error("PayPal order error:", error);
      throw new Error("Failed to create PayPal order");
    }

    const order = await orderResponse.json();
    console.log("PayPal order created:", order.id);

    // Store pending transaction in database using service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("payment_transactions").insert({
      user_id: authenticatedUserId, // Use authenticated user ID
      amount_kes,
      payment_method: "paypal",
      status: "initiated",
      checkout_request_id: order.id,
      result_desc: `PayPal order for ${plan_type} plan`,
    });

    if (dbError) {
      console.error("Database error:", dbError);
    }

    // Find the approval URL
    const approvalUrl = order.links?.find((link: any) => link.rel === "approve")?.href;

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        approval_url: approvalUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PayPal create order error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
