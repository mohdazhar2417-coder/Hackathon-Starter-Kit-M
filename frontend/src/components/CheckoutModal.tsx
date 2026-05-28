import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { 
  QrCode, ShieldCheck, CheckCircle2, Loader2, Sparkles, Smartphone, Clock, ArrowRight, ArrowLeft, Send
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  price: string;
}

export function CheckoutModal({ isOpen, onClose, planName, price }: CheckoutModalProps) {
  const { token, updateUser } = useAuth();
  const { toast } = useToast();
  
  // Payment states
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentRequestId, setPaymentRequestId] = useState<string | null>(null);
  const [upiUrl, setUpiUrl] = useState<string | null>(null);
  
  // New Step states: "pay" (scan code) -> "utr" (input ref) -> "verifying" (waiting)
  const [step, setStep] = useState<"pay" | "utr" | "verifying">("pay");
  const [utr, setUtr] = useState("");
  const [submittingUtr, setSubmittingUtr] = useState(false);

  // Timer state (5 minutes = 300 seconds)
  const [timer, setTimer] = useState(300);

  // Trigger checkout session creation as soon as the modal opens
  useEffect(() => {
    if (isOpen) {
      initiateUpiCheckout();
    } else {
      resetCheckout();
    }
  }, [isOpen]);

  // Poll status in background
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
      onClose();
    }
    return () => clearTimeout(timerId);
  }, [timer, paymentRequestId, success]);

  const resetCheckout = () => {
    setPaymentRequestId(null);
    setUpiUrl(null);
    setTimer(300);
    setLoading(false);
    setSuccess(false);
    setStep("pay");
    setUtr("");
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
  const initiateUpiCheckout = async () => {
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
          paymentMethod: "upi_qr"
        })
      });

      if (!response.ok) throw new Error("Could not initialize secure payment session");
      const data = await response.json();

      setPaymentRequestId(data.paymentRequestId);
      setUpiUrl(data.upiUrl);
      setTimer(300);
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message,
        variant: "destructive"
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  // Submit UTR Number
  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utr || !/^\d{12}$/.test(utr)) {
      toast({
        title: "Invalid UTR ID",
        description: "Please input a valid 12-digit transaction reference number.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingUtr(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/payments/submit-utr`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          requestId: paymentRequestId,
          utr
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit transaction reference ID.");
      }

      toast({
        title: "Reference Submitted Successfully",
        description: "Our administrators will verify and authorize your payment shortly."
      });
      setStep("verifying");
    } catch (err: any) {
      toast({
        title: "Submission Failure",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setSubmittingUtr(false);
    }
  };

  // Local success simulation (development utility for instant bypass)
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

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone/i.test(navigator.userAgent);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-black/95 border border-primary/20 text-white rounded-2xl shadow-[0_0_50px_rgba(29,78,216,0.15)] backdrop-blur-xl p-0 overflow-hidden">
        
        {/* Confetti overlay if success */}
        {success && (
          <div className="absolute inset-0 z-50 pointer-events-none bg-black/90 flex flex-col items-center justify-center animate-fade-in">
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
                Secure UPI Checkout
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/60 text-xs">
              Upgrade to <span className="text-white font-bold">{planName}</span> Plan • Auto-verifies instantly
            </DialogDescription>
          </DialogHeader>

          {/* Core Content Loading or Displaying QR */}
          {loading && !upiUrl ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-white/50">Generating secure transaction scanner...</p>
            </div>
          ) : (
            <div className="space-y-5 flex flex-col items-center">
              
              {/* Amount & Receiver Banner */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs w-full">
                <div className="text-left">
                  <p className="font-bold text-white/90">Christina Joseph</p>
                  <p className="text-[10px] font-mono text-white/40">christinajoseph26th@oksbi</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-white/40">Amount to Pay</p>
                  <p className="font-black text-primary text-sm">₹{planName === "Institutional" ? "9,999" : "8"}</p>
                </div>
              </div>

              {/* Progress Steps Header */}
              <div className="flex items-center justify-center gap-2 w-full text-[10px] uppercase font-bold tracking-widest text-white/30 border-b border-white/5 pb-2.5">
                <span className={step === "pay" ? "text-primary" : "text-white/60"}>1. Pay</span>
                <span className="text-white/10">/</span>
                <span className={step === "utr" ? "text-primary" : "text-white/60"}>2. Submit UTR</span>
                <span className="text-white/10">/</span>
                <span className={step === "verifying" ? "text-primary animate-pulse" : "text-white/60"}>3. Verify</span>
              </div>

              {/* Animate Step Layout */}
              <div className="w-full">
                <AnimatePresence mode="wait">
                  {step === "pay" && (
                    <motion.div
                      key="pay"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex flex-col items-center space-y-4"
                    >
                      {/* Dynamic QR Code Canvas */}
                      <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group w-full max-w-[210px] mx-auto">
                        <div className="relative w-36 h-36 bg-white p-2 rounded-xl flex items-center justify-center border border-white/20">
                          {upiUrl ? (
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                              className="w-full h-full object-contain" 
                              alt="UPI QR Scanner"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full w-full">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                          {/* Glowing Laser Effect */}
                          <div className="absolute left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(29,78,216,0.8)] top-2 animate-[bounce_2.5s_infinite]" />
                        </div>
                      </div>

                      {/* Mobile Direct Pay Trigger */}
                      {isMobile && upiUrl && (
                        <a
                          href={upiUrl}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black text-xs py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
                        >
                          <Smartphone className="h-4 w-4" />
                          Open UPI App (GPay/PhonePe)
                        </a>
                      )}

                      {/* Timer Block */}
                      <div className="flex items-center gap-2 justify-center text-xs text-white/50">
                        <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
                        <span>Expires in: <span className="font-mono text-white font-bold">{formatTimer(timer)}</span></span>
                      </div>

                      <button
                        onClick={() => setStep("utr")}
                        className="w-full border border-white/15 hover:bg-white/5 text-white font-bold text-xs py-3 rounded-xl uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                      >
                        I have completed the payment
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </button>
                    </motion.div>
                  )}

                  {step === "utr" && (
                    <motion.div
                      key="utr"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-4 w-full"
                    >
                      <form onSubmit={handleUtrSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase font-black tracking-widest text-white/50 block">
                            UPI Transaction Ref No. / UTR
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              maxLength={12}
                              required
                              value={utr}
                              onChange={(e) => setUtr(e.target.value.replace(/\D/g, ""))}
                              placeholder="Enter 12-digit Transaction ID"
                              className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded-xl px-4 py-3 text-sm focus:outline-none transition-all placeholder:text-white/20 font-mono tracking-widest"
                            />
                            <button
                              type="submit"
                              disabled={submittingUtr || utr.length !== 12}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground flex items-center justify-center transition-all disabled:opacity-30 disabled:hover:bg-primary"
                            >
                              {submittingUtr ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-white/40 leading-normal">
                          * How to find it: Open your payment confirmation screen in GPay, PhonePe, Paytm, or BHIM. Look for the 12-digit number labeled **UPI Ref No**, **UTR**, or **Transaction ID**.
                        </p>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setStep("pay")}
                            className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-black flex items-center justify-center gap-1.5 transition-all"
                          >
                            <ArrowLeft className="h-3 w-3" /> Back
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {step === "verifying" && (
                    <motion.div
                      key="verifying"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-6 space-y-4 text-center"
                    >
                      <div className="relative flex items-center justify-center">
                        <div className="h-16 w-16 rounded-full border border-primary/20 bg-primary/5 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                        <div className="absolute inset-0 rounded-full border border-primary/50 animate-ping opacity-25" />
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs uppercase font-black tracking-widest text-primary animate-pulse">
                          Verifying Payment
                        </h4>
                        <p className="text-[10px] text-white/60 leading-relaxed px-4">
                          We are verifying your transaction ID **{utr}** with our system. Your account will upgrade automatically as soon as confirmation resolves.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep("utr")}
                        className="text-[9px] text-white/40 hover:text-white underline uppercase tracking-widest transition-all"
                      >
                        Update Transaction UTR
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* UTR Verification Notice */}
              <div className="flex items-center gap-2.5 p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-[11px] text-white/80 w-full justify-center">
                <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
                <span className="leading-snug">Once you finish the transfer, submit the UTR transaction reference number to verify and activate your upgrade.</span>
              </div>
            </div>
          )}

          {/* Footer Security */}
          <div className="pt-4 flex items-center justify-center gap-1.5 text-[9px] text-white/30 border-t border-white/5 mt-4">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            <span>Secured 256-bit AES P2P transaction framework.</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
