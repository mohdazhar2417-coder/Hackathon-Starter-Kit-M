import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Shield, Globe, Cpu, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckoutModal } from "@/components/CheckoutModal";

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
    price: "12",
    description: "Advanced tools for competitive coders and CS students.",
    features: [
      "Everything in Free",
      "Unlimited saved traces",
      "Public trace sharing",
      "AI-Generated Explanations (Beta)",
      "Priority simulation speed",
    ],
    buttonText: "Upgrade to Pro",
    highlight: true,
    pro: true
  },
  {
    name: "Institutional",
    price: "Custom",
    description: "For universities, colleges, and coding bootcamps.",
    features: [
      "Everything in Pro",
      "Teacher Insight Dashboard",
      "Bulk student seat management",
      "LMS & Single Sign-On (SSO)",
      "24/7 Priority Support",
      "Custom Curriculum Integration",
    ],
    buttonText: "Request Institutional Quote",
    highlight: false,
    pro: false,
    special: true
  }
];

export default function PricingPage() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: string }>({ name: "", price: "" });
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = (planName: string) => {
    if (planName === "Free") return;
    setCheckoutPlan({ 
      name: planName, 
      price: planName === "Institutional" ? "9999" : "8" 
    });
    setIsCheckoutOpen(true);
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
              plan.highlight && "ring-2 ring-primary shadow-2xl shadow-primary/20 bg-primary/[0.02]",
              plan.special && "border-indigo-500/30 bg-indigo-500/[0.02] shadow-2xl shadow-indigo-500/10 hover:border-indigo-500/50"
            )}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}
              {plan.special && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  Campus Ready
                </div>
              )}
              <CardHeader>
                <CardTitle className={cn(
                  "text-2xl font-black uppercase tracking-tight",
                  plan.special && "text-indigo-400"
                )}>{plan.name}</CardTitle>
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
                    {loading === plan.name ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.buttonText}
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
             <p className="text-xs text-muted-foreground">All transactions are processed with 256-bit encryption.</p>
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

       <CheckoutModal 
         isOpen={isCheckoutOpen} 
         onClose={() => setIsCheckoutOpen(false)} 
         planName={checkoutPlan.name} 
         price={checkoutPlan.price} 
       />
     </div>
   );
}
