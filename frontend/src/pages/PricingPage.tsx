import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Globe, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for students getting started with logic.",
    features: [
      "Visual flowchart generation",
      "Step-by-step execution",
      "5 saved traces",
      "Community support",
    ],
    buttonText: "Current Plan",
    highlight: false,
    pro: false
  },
  {
    name: "Pro",
    price: "9",
    description: "Advanced tools for deep algorithm analysis.",
    features: [
      "Everything in Free",
      "Unlimited saved traces",
      "Public trace sharing",
      "Advanced Java support (Methods/Objects)",
      "Priority execution",
    ],
    buttonText: "Upgrade to Pro",
    highlight: true,
    pro: true
  },
  {
    name: "Enterprise",
    price: "49",
    description: "For universities and coding bootcamps.",
    features: [
      "Everything in Pro",
      "Classroom management",
      "Bulk student licenses",
      "SSO Integration",
      "Custom branding",
    ],
    buttonText: "Contact Sales",
    highlight: false,
    pro: false
  }
];

export default function PricingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planName: string) => {
    if (planName === "Free") return;
    if (planName === "Enterprise") {
      window.location.href = "mailto:sales@logiclens.dev";
      return;
    }

    setLoading(planName);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("logiclens_token")}`
        }
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      toast({
        title: "Upgrade failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto text-center mb-16 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest"
        >
          <Sparkles className="h-3 w-3" />
          Pricing Plans
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black uppercase tracking-tight"
        >
          Scale your <span className="text-primary">Logic</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-lg max-w-2xl mx-auto"
        >
          Choose the plan that fits your learning journey. From classroom basics to complex architectural visualization.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {PLANS.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
          >
            <Card className={cn(
              "relative h-full flex flex-col border-border/40 bg-card/50 backdrop-blur-xl transition-all hover:border-primary/40",
              plan.highlight && "ring-2 ring-primary shadow-2xl shadow-primary/20 bg-primary/[0.02]"
            )}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl font-black uppercase tracking-tight">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className={cn(
                    "w-full h-12 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                    plan.highlight ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-white/5 text-white/60 hover:bg-white/10"
                  )}
                  disabled={loading === plan.name || (plan.name === "Free" && user?.planType === "free")}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {loading === plan.name ? <Zap className="h-4 w-4 animate-spin" /> : plan.buttonText}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black uppercase tracking-widest text-sm">Secure Payments</h3>
            <p className="text-xs text-muted-foreground">All transactions are processed via Stripe with 256-bit encryption.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
            <Globe className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black uppercase tracking-widest text-sm">Cloud Sync</h3>
            <p className="text-xs text-muted-foreground">Access your logic traces from any device, anywhere in the world.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
