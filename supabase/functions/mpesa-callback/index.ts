import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("M-Pesa Callback received:", JSON.stringify(body, null, 2));

    const { Body } = body;
    const { stkCallback } = Body;
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stkCallback;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find the transaction
    const { data: transaction, error: findError } = await supabase
      .from("payment_transactions")
      .select("*, subscriptions(*)")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error("Transaction not found:", findError);
      return new Response(JSON.stringify({ success: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (ResultCode === 0) {
      // Payment successful
      let mpesaReceipt = "";
      let amount = 0;

      if (CallbackMetadata?.Item) {
        for (const item of CallbackMetadata.Item) {
          if (item.Name === "MpesaReceiptNumber") {
            mpesaReceipt = item.Value;
          } else if (item.Name === "Amount") {
            amount = item.Value;
          }
        }
      }

      // Update transaction
      await supabase
        .from("payment_transactions")
        .update({
          status: "completed",
          mpesa_receipt_number: mpesaReceipt,
          result_code: String(ResultCode),
          result_desc: ResultDesc,
        })
        .eq("id", transaction.id);

      // Calculate subscription dates based on plan
      const now = new Date();
      let expiresAt = new Date(now);

      switch (transaction.subscriptions?.plan_type) {
        case "monthly":
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case "quarterly":
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          break;
        case "yearly":
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          break;
      }

      // Update subscription
      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          mpesa_receipt_number: mpesaReceipt,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", transaction.subscription_id);

      console.log("Payment completed successfully:", {
        receipt: mpesaReceipt,
        amount,
        subscription_id: transaction.subscription_id,
      });
    } else {
      // Payment failed
      await supabase
        .from("payment_transactions")
        .update({
          status: "failed",
          result_code: String(ResultCode),
          result_desc: ResultDesc,
        })
        .eq("id", transaction.id);

      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", transaction.subscription_id);

      console.log("Payment failed:", ResultDesc);
    }

    // Acknowledge receipt to Safaricom
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa Callback error:", error);
    return new Response(JSON.stringify({ ResultCode: 1, ResultDesc: "Error processing callback" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
