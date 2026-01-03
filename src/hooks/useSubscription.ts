import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: "monthly" | "quarterly" | "yearly";
  status: "pending" | "active" | "expired" | "cancelled";
  amount_kes: number;
  payment_method: string;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export const PRICING_PLANS = {
  monthly: { price: 249, label: "Monthly", period: "month", savings: null },
  quarterly: { price: 599, label: "Quarterly", period: "3 months", savings: "20%" },
  yearly: { price: 1799, label: "Yearly", period: "year", savings: "40%" },
} as const;

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setIsPremium(false);
      setLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("expires_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSubscription(data as Subscription);
        const now = new Date();
        const expiresAt = data.expires_at ? new Date(data.expires_at) : null;
        setIsPremium(expiresAt ? expiresAt > now : false);
      } else {
        setSubscription(null);
        setIsPremium(false);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const initiateMpesaPayment = async (
    phoneNumber: string,
    planType: "monthly" | "quarterly" | "yearly"
  ) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe to premium",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const amount = PRICING_PLANS[planType].price;

      // Note: user_id is now derived from authenticated user in edge function
      const response = await supabase.functions.invoke("mpesa-stk-push", {
        body: {
          phone_number: phoneNumber,
          amount,
          plan_type: planType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Payment Initiated! 📱",
          description: "Please check your phone for the M-Pesa prompt and enter your PIN.",
        });
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.error || "Payment initiation failed");
      }
    } catch (error) {
      console.error("M-Pesa payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate payment",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const initiatePayPalPayment = async (
    planType: "monthly" | "quarterly" | "yearly"
  ) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to subscribe to premium",
        variant: "destructive",
      });
      return { success: false };
    }

    try {
      const amount = PRICING_PLANS[planType].price;
      const returnUrl = `${window.location.origin}/pricing?payment=success&plan=${planType}`;
      const cancelUrl = `${window.location.origin}/pricing?payment=cancelled`;

      // Note: user_id is now derived from authenticated user in edge function
      const response = await supabase.functions.invoke("paypal-create-order", {
        body: {
          plan_type: planType,
          amount_kes: amount,
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success && response.data?.approval_url) {
        // Redirect to PayPal
        window.location.href = response.data.approval_url;
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.error || "Failed to create PayPal order");
      }
    } catch (error) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to initiate PayPal payment",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const capturePayPalPayment = async (
    orderId: string,
    planType: "monthly" | "quarterly" | "yearly"
  ) => {
    if (!user) return { success: false };

    try {
      const amount = PRICING_PLANS[planType].price;

      // Note: user_id is now derived from authenticated user in edge function
      const response = await supabase.functions.invoke("paypal-capture-order", {
        body: {
          order_id: orderId,
          plan_type: planType,
          amount_kes: amount,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.success) {
        toast({
          title: "Payment Successful! 🎉",
          description: "Welcome to HappyLearn Premium!",
        });
        await fetchSubscription();
        return { success: true, data: response.data };
      } else {
        throw new Error(response.data?.error || "Failed to capture payment");
      }
    } catch (error) {
      console.error("PayPal capture error:", error);
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to complete PayPal payment",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_transactions")
        .select("status, mpesa_receipt_number")
        .eq("checkout_request_id", checkoutRequestId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error checking payment status:", error);
      return null;
    }
  };

  return {
    subscription,
    isPremium,
    loading,
    initiateMpesaPayment,
    initiatePayPalPayment,
    capturePayPalPayment,
    checkPaymentStatus,
    refetch: fetchSubscription,
  };
}
