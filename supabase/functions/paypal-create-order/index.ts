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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_type, user_id, amount_kes, return_url, cancel_url } = await req.json();

    if (!plan_type || !user_id || !amount_kes) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
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
            reference_id: `${user_id}_${plan_type}_${Date.now()}`,
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

    // Store pending transaction in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("payment_transactions").insert({
      user_id,
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
