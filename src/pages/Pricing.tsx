import { useState, useEffect } from "react";
import { Crown, Check, Sparkles, Phone, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription, PRICING_PLANS } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const FREE_FEATURES = [
  "5 AI questions per day",
  "Basic lesson access",
  "Limited subjects",
  "Community support",
];

const PREMIUM_FEATURES = [
  "Unlimited AI tutoring",
  "All CBC subjects (Grade 1-9)",
  "Full lesson notes & downloads",
  "Smart quizzes with mastery scoring",
  "Term 1-3 revision packs",
  "Parent progress reports",
  "Offline access",
  "Priority support",
];

export default function Pricing() {
  const { user } = useAuth();
  const { isPremium, subscription, initiateMpesaPayment, initiatePayPalPayment, capturePayPalPayment, loading } = useSubscription();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "quarterly" | "yearly">("monthly");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalProcessing, setPaypalProcessing] = useState(false);

  // Handle PayPal return
  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    const planType = searchParams.get("plan") as "monthly" | "quarterly" | "yearly" | null;
    const token = searchParams.get("token"); // PayPal order ID

    if (paymentStatus === "success" && token && planType && user) {
      setPaypalProcessing(true);
      capturePayPalPayment(token, planType).finally(() => {
        setPaypalProcessing(false);
        setSearchParams({});
      });
    } else if (paymentStatus === "cancelled") {
      toast({
        title: "Payment Cancelled",
        description: "Your PayPal payment was cancelled.",
        variant: "destructive",
      });
      setSearchParams({});
    }
  }, [searchParams, user]);

  const handleUpgrade = (plan: "monthly" | "quarterly" | "yearly") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your M-Pesa registered phone number",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    const result = await initiateMpesaPayment(phoneNumber, selectedPlan);
    setIsProcessing(false);

    if (result.success) {
      setShowPaymentDialog(false);
      // Poll for payment status
      toast({
        title: "Check your phone! 📱",
        description: "Enter your M-Pesa PIN when prompted. We'll update your account automatically.",
      });
    }
  };

  if (isPremium && subscription) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-2xl">
          <Card className="border-2 border-success">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-success/20 flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl">You're a Premium Member! 🎉</CardTitle>
              <CardDescription>
                Thank you for supporting HappyLearn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm font-medium">Your Plan</p>
                <p className="text-2xl font-bold capitalize">{subscription.plan_type}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-lg font-semibold text-success capitalize">{subscription.status}</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium">Expires</p>
                  <p className="text-lg font-semibold">
                    {subscription.expires_at
                      ? new Date(subscription.expires_at).toLocaleDateString("en-KE")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6">
            <Crown className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Premium Plans</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Invest in Your Child's Future
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Affordable, CBC-aligned learning that's cheaper than tuition centers.
            Pay via M-Pesa, Airtel Money, PayPal, or Zelle.
          </p>
        </div>

        {/* Comparison Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Free Plan */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-xl">Free Plan</CardTitle>
              <CardDescription>Get started with basics</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">KES 0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-muted-foreground" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
                {user ? "Current Plan" : "Sign Up Free"}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-lg">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Crown className="h-5 w-5 text-accent" />
                Premium Plan
              </CardTitle>
              <CardDescription>Everything you need to excel</CardDescription>
              <div className="pt-4">
                <span className="text-4xl font-bold">KES {PRICING_PLANS[selectedPlan].price}</span>
                <span className="text-muted-foreground">/{PRICING_PLANS[selectedPlan].period}</span>
                {PRICING_PLANS[selectedPlan].savings && (
                  <span className="ml-2 text-sm text-success font-medium">
                    Save {PRICING_PLANS[selectedPlan].savings}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Plan Toggle */}
              <div className="flex gap-2 mb-6">
                {(["monthly", "quarterly", "yearly"] as const).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedPlan === plan
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {PRICING_PLANS[plan].label}
                  </button>
                ))}
              </div>

              <ul className="space-y-3">
                {PREMIUM_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full gap-2"
                onClick={() => handleUpgrade(selectedPlan)}
                disabled={loading}
              >
                <Sparkles className="h-4 w-4" />
                Upgrade to Premium
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="text-center mb-8">
          <h3 className="text-lg font-semibold mb-4">Accepted Payment Methods</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <Smartphone className="h-5 w-5 text-success" />
              <span className="font-medium">M-Pesa</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <Phone className="h-5 w-5 text-destructive" />
              <span className="font-medium">Airtel Money</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="font-medium">PayPal</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <CreditCard className="h-5 w-5 text-secondary" />
              <span className="font-medium">Zelle</span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <span>✅ Secure payments</span>
          <span>✅ Cancel anytime</span>
          <span>✅ 7-day money back</span>
          <span>✅ Kenya-first support</span>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Complete Your Payment
            </DialogTitle>
            <DialogDescription>
              Pay KES {PRICING_PLANS[selectedPlan].price} for {PRICING_PLANS[selectedPlan].label} premium access
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="mpesa" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
            </TabsList>

            <TabsContent value="mpesa" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the phone number registered with M-Pesa
                </p>
              </div>

              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan</span>
                  <span className="font-medium capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span className="font-bold">KES {PRICING_PLANS[selectedPlan].price}</span>
                </div>
              </div>

              <Button
                className="w-full gap-2"
                onClick={handleMpesaPayment}
                disabled={isProcessing || !phoneNumber}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    Sending STK Push...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-4 w-4" />
                    Pay with M-Pesa
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You'll receive an M-Pesa prompt on your phone. Enter your PIN to complete payment.
              </p>
            </TabsContent>

            <TabsContent value="paypal" className="space-y-4 mt-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Plan</span>
                  <span className="font-medium capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount (KES)</span>
                  <span className="font-bold">KES {PRICING_PLANS[selectedPlan].price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Amount (USD approx.)</span>
                  <span className="font-medium">
                    ~${(PRICING_PLANS[selectedPlan].price * 0.0065).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-accent/10 rounded-lg p-3">
                <p className="font-medium mb-1">💡 Perfect for parents abroad!</p>
                <p>Pay securely with your PayPal account or credit/debit card.</p>
              </div>

              <Button
                className="w-full gap-2"
                onClick={async () => {
                  setIsProcessing(true);
                  await initiatePayPalPayment(selectedPlan);
                  setIsProcessing(false);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                    Redirecting to PayPal...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Pay with PayPal
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You'll be redirected to PayPal to complete your payment securely.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
