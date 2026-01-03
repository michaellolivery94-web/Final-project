import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Safaricom IP ranges for callback verification
// Reference: https://developer.safaricom.co.ke/Documentation
const SAFARICOM_IP_PREFIXES = [
  "196.201.214.",
  "196.201.213.",
  "196.201.212.",
  "41.215.125.",
];

// Check if IP is from Safaricom's network
function isValidSafaricomIP(ip: string | null): boolean {
  if (!ip) {
    console.warn("No client IP provided in request");
    return false;
  }
  
  // Handle multiple IPs in x-forwarded-for (take the first one)
  const clientIP = ip.split(",")[0].trim();
  
  // Check against Safaricom IP prefixes
  const isValid = SAFARICOM_IP_PREFIXES.some(prefix => clientIP.startsWith(prefix));
  
  if (!isValid) {
    console.warn(`Rejected callback from non-Safaricom IP: ${clientIP}`);
  }
  
  return isValid;
}

// Validate callback structure matches Safaricom spec
function isValidCallbackStructure(body: unknown): body is {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: Array<{ Name: string; Value: unknown }> };
    };
  };
} {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  
  if (!b.Body || typeof b.Body !== "object") return false;
  const bodyObj = b.Body as Record<string, unknown>;
  
  if (!bodyObj.stkCallback || typeof bodyObj.stkCallback !== "object") return false;
  const stk = bodyObj.stkCallback as Record<string, unknown>;
  
  return (
    typeof stk.MerchantRequestID === "string" &&
    typeof stk.CheckoutRequestID === "string" &&
    typeof stk.ResultCode === "number" &&
    typeof stk.ResultDesc === "string"
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security: Verify request comes from Safaricom IP range
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
    
    // In production, enforce IP whitelist. In sandbox, log warning but allow
    const isSafaricomIP = isValidSafaricomIP(clientIP);
    const isSandbox = Deno.env.get("MPESA_ENVIRONMENT") !== "production";
    
    if (!isSafaricomIP && !isSandbox) {
      console.error(`SECURITY: Rejected callback from unauthorized IP: ${clientIP}`);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!isSafaricomIP && isSandbox) {
      console.warn(`SECURITY WARNING: Allowing callback from non-Safaricom IP in sandbox mode: ${clientIP}`);
    }

    const body = await req.json();
    console.log("M-Pesa Callback received:", JSON.stringify(body, null, 2));

    // Validate callback structure
    if (!isValidCallbackStructure(body)) {
      console.error("Invalid callback structure:", JSON.stringify(body));
      return new Response(JSON.stringify({ error: "Invalid callback format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.error("Transaction not found for CheckoutRequestID:", CheckoutRequestID, findError);
      return new Response(JSON.stringify({ success: false, error: "Transaction not found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotency check: Prevent replay attacks by checking if already processed
    if (transaction.status === "completed" || transaction.status === "failed") {
      console.warn(`Duplicate callback received for already processed transaction: ${transaction.id}`);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Already processed" }), {
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
            mpesaReceipt = item.Value as string;
          } else if (item.Name === "Amount") {
            amount = item.Value as number;
          }
        }
      }

      // Validate amount matches expected amount
      if (amount !== transaction.amount_kes) {
        console.error(`SECURITY ALERT: Amount mismatch! Expected ${transaction.amount_kes}, got ${amount}`);
        // Still process but log the discrepancy for investigation
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
