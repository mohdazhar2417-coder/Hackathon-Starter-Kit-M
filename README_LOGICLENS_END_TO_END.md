# LogicLens: Production-Grade Java Execution & Learning System 🚀

LogicLens is a full-stack educational platform that transforms static Java code into a dynamic, state-driven execution visualization. It is designed to bridge the gap between "writing code" and "understanding execution" by providing a deep, step-by-step trace of every variable transformation, loop iteration, and conditional branch.

---

## 📺 Project Overview

LogicLens solves the "black box" problem of coding. Instead of just seeing an output, users see the **JVM (Java Virtual Machine) in action**. The workspace provides a 360-degree view of the program's memory, logic, and flow, making it an essential tool for beginners and competitive programmers alike.

---

## 🛠 Technology Stack

### **Frontend**
*   **React & TypeScript**: Type-safe component architecture.
*   **Monaco Editor**: The same engine powering VS Code, used for high-fidelity code display and execution syncing.
*   **Zustand**: ultra-fast state management for sub-millisecond synchronization between the editor, timeline, and memory panels.
*   **Framer Motion**: Smooth micro-animations for state transitions and timeline progression.
*   **Shadcn UI + Tailwind CSS**: A custom-themed, modern design system for a premium SaaS feel.

### **Backend & Data**
*   **Next.js API Routes**: Server-side logic for trace persistence and user management.
*   **Prisma ORM**: Type-safe database access.
*   **PostgreSQL**: Reliable storage for user profiles, saved traces, and favorite programs.
*   **Zod**: Runtime schema validation for API integrity.

---

## 🧠 Core Architecture: The Simulation Engine

The heart of LogicLens is the **Custom Simulation Engine** (`simulationEngine.ts`). Unlike a standard debugger, it doesn't just pause; it pre-analyzes and "unrolls" the execution into a comprehensive trace.

### **The Execution Pipeline**
1.  **Tokenization**: The engine breaks the Java source code into logical units (Statements), handling complex structures like nested blocks and semicolon-heavy `for` loop headers.
2.  **Static Analysis**: It maps each statement to its line number in the Monaco Editor.
3.  **Symbolic Execution**: The engine runs the code in a virtual environment, resolving expressions, evaluating conditions, and capturing "Before" and "After" memory snapshots.
4.  **Trace Generation**: It produces a flat array of `ExecutionStep` objects, which include:
    *   **Calculations**: Step-by-step arithmetic breakdown (e.g., `121 % 10 = 1`).
    *   **State Diffs**: Precisely which variables changed and their new values.
    *   **Output Buffer**: A snapshot of the console output at that specific moment.

---

## 🏗 Workspace Feature Breakdown

### **1. 3-Column Command Center**
*   **Code Column**: Highlights the active executing line. Changes are reflected instantly as you step through the trace.
*   **Execution Timeline**: A vertical "execution graph". Every loop iteration is unrolled into its own labeled section, allowing users to see exactly how data evolves over time.
*   **Memory Visualization**:
    *   **Variable Grid**: Real-time tracking of `int`, `double`, `String`, and `boolean` types.
    *   **Call Stack**: Visual representation of active method frames (currently `main()`).
    *   **Heap Space**: Ready for future object-oriented object tracking.

### **2. Full-Width Analysis Suite (Bottom Panel)**
*   **Program Console**: Capture every `print` statement exactly as it would appear in a terminal.
*   **Step Explanation**: A beginner-friendly translation of the code line into plain English, coupled with "Pro Tips" for better coding practices.
*   **Iteration Trace Table**: A powerful debugging tool that groups variable changes by loop iteration, perfect for understanding algorithms like Prime checks or Fibonacci.
*   **Final Validation**: A high-impact panel that displays the final result of the program (e.g., "Palindrome ✅") to give users a sense of completion.

---

## 📁 Project Structure

```text
├── frontend/
│   ├── src/
│   │   ├── engines/           # Core LogicLens Simulation Engine
│   │   ├── components/        # Specialized UI (Timeline, StepCard, MemoryVisualizer)
│   │   ├── hooks/             # Store management and trace interactions
│   │   ├── data/              # 5 Categories of Sample Programs
│   │   └── pages/             # Workspace, Dashboard, and Admin views
├── backend/                   # API Routes and Persistence Logic
├── packages/
│   └── db/                    # Prisma Schema and DB Migrations
└── README_LOGICLENS.md        # Detailed project documentation
```

---

## 🚀 Key Features for Success
*   **Zero-Config Setup**: No need to install a JDK or IDE. Code runs and traces entirely in the browser.
*   **Deep Tracing**: Unlike `print` debugging, LogicLens shows you the *state of all variables* at every single line.
*   **Performance**: The engine can handle up to 1,000 execution steps and 500 loop iterations in milliseconds.
*   **Mobile Responsive**: Review execution traces on the go with a mobile-optimized UI.

---

## 🔧 Installation & Local Setup

1.  **Clone the Repository**:
    ```bash
    git clone [repository-url]
    ```
2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```
3.  **Setup Environment**:
    Create a `.env` file with your database connection strings.
4.  **Run Migrations**:
    ```bash
    pnpm db:push
    ```
5.  **Launch the Application**:
    ```bash
    pnpm dev
    ```
    Access the workspace at `http://localhost:5173`.

---

## 🛠 Future Enhancements
*   **Recursive Visualization**: Visualizing recursive calls via a dynamic call tree.
*   **Object Tracking**: Full support for `new` keyword and heap address mapping.
*   **Multi-Language Support**: Expanding the engine to support Python and C++ logic.
*   **AI Tutor**: Integration with LLMs to provide real-time personalized feedback on logic errors.
