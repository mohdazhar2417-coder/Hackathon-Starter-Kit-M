import { create } from 'zustand';
import type { ExecutionStep, SimulationResult } from '@/engines/simulate/simulationEngine';

interface WorkspaceState {
  // Execution Data
  simResult: SimulationResult | null;
  activeStep: number;
  isRunning: boolean;
  autoPlay: boolean;
  
  // UI State
  selectedProgram: any | null;
  customInputs: Record<string, string>;
  
  // Actions
  setSimResult: (result: SimulationResult | null) => void;
  setActiveStep: (step: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setAutoPlay: (autoPlay: boolean) => void;
  setSelectedProgram: (program: any | null) => void;
  setCustomInputs: (inputs: Record<string, string>) => void;
  
  // Navigation Helpers
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  simResult: null,
  activeStep: 0,
  isRunning: false,
  autoPlay: false,
  selectedProgram: null,
  customInputs: {},

  setSimResult: (result) => set({ simResult: result, activeStep: 0 }),
  setActiveStep: (step) => set({ activeStep: step }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setAutoPlay: (autoPlay) => set({ autoPlay }),
  setSelectedProgram: (program) => set({ selectedProgram: program, simResult: null, activeStep: 0 }),
  setCustomInputs: (inputs) => set({ customInputs: inputs }),

  nextStep: () => {
    const { activeStep, simResult } = get();
    if (simResult && activeStep < simResult.steps.length - 1) {
      set({ activeStep: activeStep + 1 });
    }
  },
  
  prevStep: () => {
    const { activeStep, simResult } = get();
    if (!simResult) return; // safety guard
    if (activeStep > 0) {
      set({ activeStep: activeStep - 1 });
    }
  },

  goToStep: (step) => {
    const { simResult } = get();
    if (simResult) {
      const safeStep = Math.max(0, Math.min(step, simResult.steps.length - 1));
      set({ activeStep: safeStep });
    }
  },
}));
