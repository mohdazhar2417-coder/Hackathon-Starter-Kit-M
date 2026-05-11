import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Code2, BookMarked, ArrowRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OnboardingTour({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const steps = [
    {
      title: "Welcome to LogicLens!",
      description: "Ready to see how your Java code actually thinks? Let's take a quick 1-minute tour of the platform.",
      icon: <Sparkles className="h-10 w-10 text-primary" />,
      color: "bg-primary/10",
    },
    {
      title: "The Algorithm Library",
      description: "Start by picking a program from our curated library of 30+ beginner-friendly patterns and algorithms.",
      icon: <BookMarked className="h-10 w-10 text-emerald-400" />,
      color: "bg-emerald-400/10",
    },
    {
      title: "Analyze & Trace",
      description: "Hit the 'Build Flowchart' button to transform static code into a dynamic execution path instantly.",
      icon: <Play className="h-10 w-10 text-amber-400" />,
      color: "bg-amber-400/10",
    },
    {
      title: "Step-by-Step Learning",
      description: "Use the controls to step forward and backward. Watch variables update and logic branch in real-time.",
      icon: <Code2 className="h-10 w-10 text-purple-400" />,
      color: "bg-purple-400/10",
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-card/95 backdrop-blur-xl shadow-2xl">
        <div className={`h-32 flex items-center justify-center ${currentStep.color} transition-colors duration-500`}>
          <motion.div
            key={step}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 12 }}
          >
            {currentStep.icon}
          </motion.div>
        </div>

        <div className="p-8">
          <div className="flex gap-1 mb-6">
            {[...Array(totalSteps)].map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i + 1 === step ? "w-8 bg-primary" : i + 1 < step ? "w-4 bg-primary/40" : "w-4 bg-muted"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DialogHeader className="text-left mb-4">
                <DialogTitle className="text-2xl font-black tracking-tight">{currentStep.title}</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed pt-2">
                  {currentStep.description}
                </DialogDescription>
              </DialogHeader>
            </motion.div>
          </AnimatePresence>

          <DialogFooter className="mt-8">
            {step < totalSteps ? (
              <Button onClick={() => setStep(step + 1)} className="w-full h-12 gap-2 text-base shadow-lg shadow-primary/20">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={onClose} className="w-full h-12 gap-2 text-base bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/20">
                Let's Code!
                <Check className="h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
