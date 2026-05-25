import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  CreditCard, QrCode, Building, ShieldCheck, CheckCircle2, 
  Loader2, Sparkles, Smartphone, Landmark, AlertCircle, ArrowRight, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
}

type PaymentMethodType = 
  | "menu" 
  | "upi_gpay" 
  | "upi_phonepe" 
  | "upi_paytm" 
  | "upi_collect" 
  | "card" 
  | "netbanking" 
  | "instamojo";

export function CheckoutModal({ isOpen, onClose, planName, price }: CheckoutModalProps) {
  const { token, updateUser } = useAuth();
  const { toast } = useToast();
  
  // Payment states
  const [currentStep, setCurrentStep] = useState<PaymentMethodType>("menu");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  // Metadata returned by API
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(true);

  // Form Fields
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  
  // Timer state (5 minutes = 300 seconds)
  const [timer, setTimer] = useState(300);

  // Poll status interval ID
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (paymentRequestId && !success) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/status/${paymentRequestId}`, {
            headers: {
              "Authorization": `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.status === "completed") {
              handlePaymentSuccess();
            }
          }
        } catch (err) {
          console.error("Error polling payment status:", err);
        }
      }, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentRequestId, success]);

  // Countdown timer hook
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (paymentRequestId && timer > 0 && !success) {
      timerId = setTimeout(() => setTimer(timer - 1), 1000);
    } else if (timer === 0) {
      toast({
        title: "Transaction Expired",
        description: "Your session has expired. Please try initiating payment again.",
        variant: "destructive"
      });
      resetCheckout();
    }
    return () => clearTimeout(timerId);
  }, [timer, paymentRequestId, success]);

  const resetCheckout = () => {
    setCurrentStep("menu");
    setPaymentRequestId(null);
    setUpiUrl(null);
    setRedirectUrl(null);
    setTimer(300);
    setLoading(false);
    setSuccess(false);
    setUpiId("");
  };

  const handlePaymentSuccess = async () => {
    setSuccess(true);
    // Reload user data to update premium role in context
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const uData = await res.json();
        updateUser(uData);
      }
    } catch (e) {
      console.error(e);
    }
    
    setTimeout(() => {
      toast({
        title: "Upgrade Successful!",
        description: `Your subscription to ${planName} is active! Welcome aboard.`,
      });
      onClose();
      resetCheckout();
    }, 3000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initiate Payment Request on backend
  const initiatePayment = async (method: PaymentMethodType) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/create-payment-intent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          planType: planName.toLowerCase() === "institutional" ? "institutional" : "pro",
          paymentMethod: method
        })
      });

      if (!response.ok) throw new Error("Could not initialize secure gateway session");
      const data = await response.json();

      setPaymentRequestId(data.paymentRequestId);
      setUpiUrl(data.upiUrl);
      setRedirectUrl(data.redirectUrl);
      setIsMock(data.isMock);
      setCurrentStep(method);
      setTimer(300);

      if (method === "instamojo" || method === "card") {
        // Redirect directly for real gateways, or mock gateways
        window.open(data.redirectUrl, "_blank");
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Local success simulation (development utility)
  const triggerSimulationSuccess = async () => {
    if (!paymentRequestId) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/simulate-payment-success`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ requestId: paymentRequestId })
      });
      if (res.ok) {
        toast({ title: "Simulation Success", description: "Simulating payment verification..." });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-black/95 border border-primary/20 text-white rounded-2xl shadow-[0_0_50px_rgba(29,78,216,0.15)] backdrop-blur-xl p-0 overflow-hidden">
        
        {/* Confetti element if success */}
        {success && (
          <div className="absolute inset-0 z-50 pointer-events-none bg-black/80 flex flex-col items-center justify-center animate-fade-in">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100 }}
              className="flex flex-col items-center space-y-4 p-6 text-center"
            >
              <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-widest text-emerald-400">Payment Approved!</h3>
                <p className="text-xs text-white/60">LogicLens premium features are unlocked.</p>
              </div>
              <p className="text-[10px] text-white/40 animate-pulse">Upgrading workspace context...</p>
            </motion.div>
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center border border-primary/20">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
              </div>
              <DialogTitle className="text-md font-black uppercase tracking-widest text-primary">
                Secure Checkout
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/60 text-xs">
              Upgrade to <span className="text-white font-bold">{planName}</span> • Instant automated activation
            </DialogDescription>
          </DialogHeader>

          {/* Steps container */}
          <AnimatePresence mode="wait">
            
            {/* STEP 1: OPTIONS MENU (Zomato style) */}
            {currentStep === "menu" && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-5"
              >
                {/* Billing Summary Banner */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white/90">{planName} Subscription</p>
                    <p className="text-[10px] text-white/40">Includes all premium cs features</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-white/40">Amount to Pay</p>
                    <p className="font-black text-primary text-sm">₹{planName === "Institutional" ? "9,999" : "299"}</p>
                  </div>
                </div>

                {/* UPI Options */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Smartphone className="h-3 w-3 text-primary" />
                    UPI Payments (Scan QR / Collect)
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => initiatePayment("upi_gpay")}
                      disabled={loading}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                      <img src="https://images.credential.net/embed/logo/google-pay-logo.png" className="h-4 object-contain brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity" alt="GPay" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                      <span className="text-[10px] font-bold text-white/70">Google Pay</span>
                    </button>
                    <button
                      onClick={() => initiatePayment("upi_phonepe")}
                      disabled={loading}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                      <span className="text-primary font-black tracking-tighter text-xs group-hover:scale-105 transition-transform">P</span>
                      <span className="text-[10px] font-bold text-white/70">PhonePe</span>
                    </button>
                    <button
                      onClick={() => initiatePayment("upi_paytm")}
                      disabled={loading}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex flex-col items-center justify-center gap-1 transition-all group"
                    >
                      <span className="text-emerald-400 font-black tracking-widest text-[10px] group-hover:scale-105 transition-transform">Paytm</span>
                      <span className="text-[10px] font-bold text-white/70">Paytm</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setCurrentStep("upi_collect")}
                    disabled={loading}
                    className="w-full p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs font-bold transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <QrCode className="h-4 w-4 text-white/60" />
                      <span>Enter UPI VPA ID (Collect Request)</span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-white/40" />
                  </button>
                </div>

                {/* Gateway Options */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-white/40 flex items-center gap-2">
                    <Landmark className="h-3 w-3 text-primary" />
                    Cards / Net Banking Gateways
                  </h3>

                  <button
                    onClick={() => initiatePayment("instamojo")}
                    disabled={loading}
                    className="w-full p-3.5 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-indigo-500/20 rounded-xl flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wider text-white/90">Instamojo Gateway</p>
                        <p className="text-[9px] text-white/50">Pay via UPI QR, Net Banking, or Cards</p>
                      </div>
                    </div>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                    ) : (
                      <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => initiatePayment("card")}
                      disabled={loading}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex items-center gap-2 transition-all justify-center"
                    >
                      <CreditCard className="h-3.5 w-3.5 text-white/60" />
                      <span className="text-[10px] font-bold">Stripe Card</span>
                    </button>
                    <button
                      onClick={() => setCurrentStep("netbanking")}
                      disabled={loading}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 flex items-center gap-2 transition-all justify-center"
                    >
                      <Building className="h-3.5 w-3.5 text-white/60" />
                      <span className="text-[10px] font-bold">Bank Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Footer Security */}
                <div className="pt-2 flex items-center justify-center gap-1.5 text-[9px] text-white/40">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  <span>Fully automated, PCI-compliant secure encryption.</span>
                </div>
              </motion.div>
            )}

            {/* STEP 2: UPI APP SCAN QR OVERLAY */}
            {(currentStep === "upi_gpay" || currentStep === "upi_phonepe" || currentStep === "upi_paytm") && (
              <motion.div
                key="upi_qr"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 flex flex-col items-center text-center"
              >
                {/* Back Link */}
                <button onClick={resetCheckout} className="self-start text-[10px] text-white/50 hover:text-white flex items-center gap-1">
                  ← Choose other payment method
                </button>

                {/* Dynamic App Brand Header */}
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  <Smartphone className="h-3 w-3 text-primary animate-pulse" />
                  <span>Paying via {currentStep.replace("upi_", "").toUpperCase()}</span>
                </div>

                {/* Dynamic QR Code Box */}
                <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 relative overflow-hidden group w-full max-w-[240px]">
                  <div className="relative w-44 h-44 bg-white p-2 rounded-xl flex items-center justify-center border border-white/20">
                    {upiUrl ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`}
                        className="w-full h-full object-contain" 
                        alt="UPI Payment QR"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                    {/* Scan Laser effect */}
                    <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(29,78,216,0.8)] top-2 animate-[bounce_2.5s_infinite]" />
                  </div>
                  <div className="text-[10px] text-white/60 font-semibold flex items-center gap-1">
                    <span>Payee:</span>
                    <span className="text-white font-bold font-mono">mohdazhar2417@okaxis</span>
                  </div>
                </div>

                {/* Timer and Instructions */}
                <div className="space-y-1">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Scan QR on phone to pay</p>
                  <p className="text-xl font-mono font-black text-primary animate-pulse">{formatTimer(timer)}</p>
                </div>

                {/* Polling Spinner Ring */}
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-white/80 w-full justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Waiting for automated bank confirmation...</span>
                </div>

                {/* Simulation Shortcut (Development Only) */}
                {isMock && (
                  <div className="pt-2 border-t border-white/5 w-full">
                    <button 
                      onClick={triggerSimulationSuccess} 
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline uppercase tracking-widest flex items-center gap-1.5 mx-auto"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      Simulate Success
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: UPI COLLECT VPA FLOW */}
            {currentStep === "upi_collect" && (
              <motion.div
                key="upi_collect"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <button onClick={resetCheckout} className="text-[10px] text-white/50 hover:text-white flex items-center gap-1">
                  ← Back to menu
                </button>

                {!paymentRequestId ? (
                  // Entry View
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="upi-vpa" className="text-xs text-white/70">Enter UPI ID / VPA</Label>
                      <Input
                        id="upi-vpa"
                        placeholder="username@okaxis"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-10"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        required
                      />
                      <p className="text-[9px] text-white/40">A payment collect notification will be sent to your UPI app.</p>
                    </div>

                    <Button
                      onClick={() => initiatePayment("upi_collect")}
                      disabled={loading || !upiId.includes("@")}
                      className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest text-xs h-10 shadow-lg shadow-primary/20"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                          Verifying VPA...
                        </>
                      ) : (
                        "Verify & Send Request"
                      )}
                    </Button>
                  </div>
                ) : (
                  // Waiting/Polling View
                  <div className="space-y-5 flex flex-col items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(29,78,216,0.2)]">
                      <Smartphone className="h-6 w-6 text-primary animate-[bounce_2s_infinite]" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-white">Collect Request Sent!</h4>
                      <p className="text-xs text-white/50">Please open your UPI app (linked to <span className="text-white font-mono">{upiId}</span>) and approve the request of <span className="text-primary font-bold">₹{planName === "Institutional" ? "9,999" : "299"}</span>.</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">Time remaining</p>
                      <p className="text-lg font-mono font-black text-primary">{formatTimer(timer)}</p>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-white/80 w-full justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span>Checking approval status...</span>
                    </div>

                    {isMock && (
                      <div className="pt-2 border-t border-white/5 w-full">
                        <button 
                          onClick={triggerSimulationSuccess} 
                          className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline uppercase tracking-widest flex items-center gap-1.5 mx-auto"
                        >
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          Simulate Mobile Approval
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 4: BANK TRANSFER METHOD (Manual backup / Details view) */}
            {currentStep === "netbanking" && (
              <motion.div
                key="netbanking"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <button onClick={resetCheckout} className="text-[10px] text-white/50 hover:text-white flex items-center gap-1">
                  ← Back to menu
                </button>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/40">Account Name:</span>
                    <span className="font-bold text-white text-right">LogicLens Tech Pvt Ltd</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Bank Name:</span>
                    <span className="font-bold text-white">HDFC Bank Limited</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">Account Number:</span>
                    <span className="font-mono font-bold text-white">50200084726514</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/40">IFSC Code:</span>
                    <span className="font-mono font-bold text-primary">HDFC0000240</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2 text-xs text-amber-300">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <p className="text-[11px] leading-snug">To verify bank transfers automatically, please use the **Instamojo Gateway** option instead. Direct bank transfers require manual UTR validation by admins.</p>
                </div>

                <Button
                  onClick={() => initiatePayment("netbanking")}
                  disabled={loading}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 rounded-lg uppercase tracking-wider transition-all"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Initiate Bank Transfer Request"}
                </Button>
              </motion.div>
            )}

            {/* STEP 5: INSTAMOJO INITIATED */}
            {currentStep === "instamojo" && (
              <motion.div
                key="instamojo_view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5 flex flex-col items-center text-center py-4"
              >
                <div className="h-10 w-10 rounded bg-[#1D2C4D] flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(29,78,216,0.3)]">
                  <Landmark className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Instamojo Gateway Opened</h4>
                  <p className="text-xs text-white/50">We opened the secure Instamojo payment screen in a new window/tab. Please complete payment there.</p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/20 rounded-xl text-xs text-white/80 w-full justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Waiting for Instamojo approval...</span>
                </div>

                <div className="flex flex-col gap-2 w-full pt-2">
                  <a
                    href={redirectUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <span>Reopen Payment Link</span>
                    <ArrowRight className="h-3 w-3" />
                  </a>
                  <button
                    onClick={resetCheckout}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/60 text-xs font-bold rounded-lg"
                  >
                    Cancel / Choose Other Method
                  </button>
                </div>

                {isMock && (
                  <div className="pt-2 border-t border-white/5 w-full">
                    <button 
                      onClick={triggerSimulationSuccess} 
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold underline uppercase tracking-widest flex items-center gap-1.5 mx-auto"
                    >
                      <Sparkles className="h-3 w-3 animate-pulse" />
                      Simulate Success
                    </button>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
