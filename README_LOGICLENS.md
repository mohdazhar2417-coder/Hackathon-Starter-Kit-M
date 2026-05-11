# LogicLens Workspace 🚀

LogicLens Workspace is a production-grade, state-driven execution visualization system designed to help developers and students understand exactly how Java code runs, step-by-step. It transforms static code into a dynamic, interactive learning experience.

## 🌟 Core Features

### 1. State-Driven Execution Engine
*   **Precision Tracing**: Every single operation (assignments, increments, divisions) is captured with "Before" and "After" state snapshots.
*   **Java-Accurate Logic**: Implements specific Java behaviors like **Integer Division** (truncation) and proper `if-else` branching logic.
*   **Loop Unrolling**: Unlike standard debuggers, LogicLens unrolls every loop iteration into distinct, labeled steps for maximum clarity.

### 2. The 3-Column IDE Layout
*   **Left (Code Editor)**: A fully integrated **Monaco Editor** that highlights the active execution line in real-time and auto-scrolls to keep the logic in focus.
*   **Center (Execution Timeline)**: A vertical, connected step-flow. Each step card shows the title, status (Completed/Current/Pending), and the actual calculation logic.
*   **Right (Memory Panel)**: Visualizes the JVM state, including active variables (highlighted when updated), the Call Stack (`main()` frame), and Heap Space.

### 3. Deep Logic Visualization
*   **Step Cards**: Shows the raw code vs. substituted values (e.g., `reversed * 10 + rem → 0 * 10 + 1 = 1`).
*   **State Transformation**: Clearly displays how variables evolve (e.g., `n: 121 → 12`).
*   **Iteration Trace Table**: A structured data view of how loop variables change across every single iteration.

### 4. Analysis & Validation
*   **Step Explanation**: Beginner-friendly breakdowns of what's happening at each line, accompanied by "Beginner Tips".
*   **Program Console**: Real-time capture of `System.out.print` and `println` output.
*   **Final Validation**: A high-impact panel that triggers at the end of execution to confirm final results (e.g., "Palindrome ✅" or "Sum = 15").

---

## 🛠 Technical Implementation (Done So Far)

### **Frontend Architecture**
*   **React + TypeScript**: Built for high performance and type safety.
*   **Zustand Store**: Centralized state management for synchronization between the Editor, Timeline, and Memory panels.
*   **Shadcn UI + Tailwind**: Premium, modern design system with dark mode support and glassmorphism.

### **Simulation Engine (`simulationEngine.ts`)**
*   **Custom Tokenizer**: Handles complex Java structures, nested loops, and semicolon-heavy `for` headers.
*   **Expression Evaluator**: A safe, sandbox-aware evaluator that handles arithmetic, boolean logic, and string concatenation.
*   **Trace Generator**: Produces a rich array of `ExecutionStep` objects, each containing full environment metadata.

### **Key Components Built**
- `JavaEditor.tsx`: Monaco Editor wrapper with line highlighting.
- `StepCard.tsx`: Detail-rich execution step visualizer.
- `ExecutionTimeline.tsx`: Continuous vertical step flow logic.
- `MemoryVisualizer.tsx`: Variable, Stack, and Heap visualization.
- `LoopTraceTable.tsx`: Tabular view of variable evolution.
- `FinalCheckPanel.tsx`: Post-execution validation UI.
- `WorkspacePage.tsx`: The layout engine orchestrating the entire system.

---

## 📚 Supported Learning Categories
The system currently handles 5 major categories of Java programs:
1.  **Basic I/O & Math**: Simple input, arithmetic, and swap logic.
2.  **Conditionals**: `if-else`, `else-if` chains, and boolean checks.
3.  **Loops**: `for` and `while` loop mechanics and boundary conditions.
4.  **Number Logic**: Palindromes, Armstrong numbers, Prime checks, and Digits extraction.
5.  **Pattern Programs**: Nested loop visualizations for geometric shapes.

---

## 🚀 Getting Started
1.  Navigate to the `/workspace` page.
2.  Select a program from the sidebar.
3.  Adjust any **Custom Inputs** (e.g., change `n` to 12321).
4.  Click **"Run Analysis"**.
5.  Use the **Step Forward** or **Play** buttons to watch the code come to life.

---

## 🏗 Future Roadmap
- [ ] **Method Call Tracing**: Support for custom static methods and call depth visualization.
- [ ] **Object-Oriented Visualization**: Rendering class instances in the Heap.
- [ ] **Trace Persistence**: Saving and sharing execution walkthroughs via the API.
- [ ] **Interactive Quiz Mode**: Guess the next variable state to earn points.
