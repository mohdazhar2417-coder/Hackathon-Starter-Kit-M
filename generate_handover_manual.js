const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// 1. Initialize PDF Document with Buffered Pages
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 60, bottom: 65, left: 50, right: 50 },
  bufferPages: true
});

// Stream output to root workspace path
const outputFilePath = path.join(__dirname, 'LogicLens_Complete_Handover_Manual.pdf');
const writeStream = fs.createWriteStream(outputFilePath);
doc.pipe(writeStream);

// 2. Core Premium Color Palette
const colors = {
  indigo: '#1e1b4b',      // Deep indigo for main headings
  blue: '#2563eb',        // Primary blue for subheadings
  sky: '#0284c7',         // Sky blue for active elements / info callouts
  teal: '#0d9488',        // Teal for success panels
  slateDark: '#0f172a',   // OLED Black / Dark slate for backgrounds & header text
  slateText: '#334155',   // Charcoal Slate for paragraph bodies
  slateLight: '#f8fafc',  // Creamy slate white for box highlights
  slateBorder: '#e2e8f0', // Muted border grey
  emerald: '#059669',     // Rich green for success/completed alerts
  amber: '#d97706',       // Amber gold for warnings/roadmaps
  rose: '#e11d48'         // Crimson rose for constraints/errors
};

// 3. Layout Grid Dimensions & Math Helpers
const pageHeight = doc.page.height;
const marginBottom = doc.page.margins.bottom;
const maxY = pageHeight - marginBottom;

function checkSpace(heightNeeded) {
  if (doc.y + heightNeeded > maxY) {
    doc.addPage();
  }
}

// 4. Custom Component Builders (H1, H2, Paragraph, Lists, Callouts, Tables)
function H1(text) {
  checkSpace(45);
  doc.moveDown(1.5);
  doc.font('Helvetica-Bold').fontSize(15).fillColor(colors.indigo).text(text, { keepWithNext: true });
  doc.moveDown(0.4);
}

function H2(text) {
  checkSpace(35);
  doc.moveDown(1);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.blue).text(text, { keepWithNext: true });
  doc.moveDown(0.3);
}

function H3(text) {
  checkSpace(25);
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.slateDark).text(text, { keepWithNext: true });
  doc.moveDown(0.2);
}

function P(text) {
  checkSpace(30);
  doc.font('Helvetica').fontSize(9).fillColor(colors.slateText).text(text, {
    align: 'justify',
    lineGap: 3
  });
  doc.moveDown(0.4);
}

function Bullet(text, level = 0) {
  checkSpace(18);
  const indent = 20 + level * 15;
  const currentX = doc.page.margins.left;
  
  doc.font('Helvetica').fontSize(9).fillColor(colors.slateText);
  doc.text('•  ' + text, currentX + indent, doc.y, {
    width: doc.page.width - doc.page.margins.left - doc.page.margins.right - indent,
    lineGap: 2.5
  });
  
  doc.x = currentX;
  doc.moveDown(0.3);
}

function Callout(title, body, type = 'info') {
  const widthVal = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const textHeight = doc.heightOfString(body, { width: widthVal - 30 }) + 10;
  const contentHeight = textHeight + 25;
  
  checkSpace(contentHeight + 15);
  
  const startX = doc.x;
  const startY = doc.y;
  
  let borderColor = colors.sky;
  let bgColor = '#f0f9ff';
  if (type === 'warning') {
    borderColor = colors.amber;
    bgColor = '#fffbeb';
  } else if (type === 'success') {
    borderColor = colors.emerald;
    bgColor = '#ecfdf5';
  } else if (type === 'danger') {
    borderColor = colors.rose;
    bgColor = '#fff1f2';
  }
  
  doc.save();
  // Draw background box
  doc.rect(startX, startY, widthVal, contentHeight).fillAndStroke(bgColor, 'none');
  // Draw left border
  doc.rect(startX, startY, 4, contentHeight).fill(borderColor);
  // Title
  doc.font('Helvetica-Bold').fontSize(9).fillColor(colors.slateDark).text(title, startX + 15, startY + 8);
  // Body text
  doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateText).text(body, startX + 15, startY + 22, {
    width: widthVal - 30,
    lineGap: 2
  });
  doc.restore();
  
  doc.x = startX;
  doc.y = startY + contentHeight;
  doc.moveDown(0.6);
}

function CodeBlock(code) {
  const widthVal = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const textHeight = doc.heightOfString(code, { width: widthVal - 30, font: 'Courier' }) + 10;
  const contentHeight = textHeight + 15;
  
  checkSpace(contentHeight + 15);
  
  const startX = doc.x;
  const startY = doc.y;
  
  doc.save();
  // Terminal outline box
  doc.rect(startX, startY, widthVal, contentHeight).fillAndStroke('#0f172a', 'none');
  // Monospaced text
  doc.font('Courier').fontSize(8).fillColor('#cbd5e1');
  doc.text(code, startX + 15, startY + 8, {
    width: widthVal - 30,
    lineGap: 2.5
  });
  doc.restore();
  
  doc.x = startX;
  doc.y = startY + contentHeight;
  doc.moveDown(0.6);
}

function Table(headers, rows, colWidths) {
  const rowHeight = 18;
  const tableHeight = (rows.length + 1) * rowHeight;
  checkSpace(tableHeight + 20);
  
  const startX = doc.x;
  const startY = doc.y;
  
  // Draw Header Row
  doc.save();
  doc.rect(startX, startY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill(colors.indigo);
  
  let currentX = startX;
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], currentX + 6, startY + 5, { width: colWidths[i] - 12, lineBreak: false });
    currentX += colWidths[i];
  }
  doc.restore();
  
  // Draw Data Rows
  let currentY = startY + rowHeight;
  doc.font('Helvetica').fontSize(8).fillColor(colors.slateText);
  
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const isEven = r % 2 === 0;
    
    // Background color for striping
    doc.save();
    if (isEven) {
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#f8fafc');
    } else {
      doc.rect(startX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight).fill('#ffffff');
    }
    doc.restore();
    
    // Draw cells
    currentX = startX;
    for (let c = 0; c < row.length; c++) {
      doc.text(String(row[c]), currentX + 6, currentY + 5, { width: colWidths[c] - 12, lineBreak: false });
      currentX += colWidths[c];
    }
    
    // Draw horizontal line
    doc.moveTo(startX, currentY + rowHeight)
       .lineTo(startX + colWidths.reduce((a, b) => a + b, 0), currentY + rowHeight)
       .strokeColor('#e2e8f0').lineWidth(0.5).stroke();
       
    currentY += rowHeight;
  }
  
  doc.x = startX;
  doc.y = currentY;
  doc.moveDown(0.6);
}

// 5. RENDER THE GORGEOUS COVER PAGE
doc.rect(0, 0, 595.28, 841.89).fill(colors.slateDark);

// Grid pattern opacity overlay
doc.save();
doc.opacity(0.12);
doc.strokeColor('#38bdf8').lineWidth(0.75);
for (let x = 0; x < 595; x += 25) {
  doc.moveTo(x, 0).lineTo(x, 841).stroke();
}
for (let y = 0; y < 841; y += 25) {
  doc.moveTo(0, y).lineTo(595, y).stroke();
}
doc.restore();

// Neon blue-green double left border accent strips
doc.rect(0, 0, 12, 841.89).fill('#3b82f6');
doc.rect(12, 0, 4, 841.89).fill('#0d9488');

// Title text details
doc.fillColor('#ffffff');
doc.font('Helvetica-Bold').fontSize(38).text('LOGICLENS', 60, 190, { characterSpacing: 1.5 });
doc.font('Helvetica').fontSize(13).fillColor('#38bdf8').text('POWERED BY TRACEWISE AI', 60, 232, { characterSpacing: 2 });

// Decorative Divider
doc.moveTo(60, 260).lineTo(480, 260).strokeColor('#334155').lineWidth(2).stroke();

doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff').text(
  'The Complete End-to-End System Manual, Architecture Specification & Developer Handover Blueprint', 
  60, 285, 
  { width: 430, lineGap: 5 }
);

doc.font('Helvetica').fontSize(10).fillColor('#94a3b8').text(
  'A self-contained production-grade repository blueprint and execution guide. This reference manual maps every architectural component, execution tracing parser, schema entity, and user interface state-machine in the LogicLens codebase. Designed to enable high-velocity development without prior chat history context.', 
  60, 360, 
  { width: 430, lineGap: 4.5, align: 'justify' }
);

// Metadata boxes at bottom
doc.rect(60, 520, 430, 1).fill('#334155');

doc.font('Helvetica-Bold').fontSize(10).fillColor('#38bdf8').text('SYSTEM DATA & SPECIFICATIONS', 60, 545);

const metaRows = [
  ['System Architect:', 'Antigravity AI Co-Pilot (DeepMind Engineering Group)'],
  ['Project Type:', 'Full-Stack Educational Visualizer (SaaS Paradigm)'],
  ['Development State:', 'Phase 2 Completed (Production Ready & Split Deployed)'],
  ['Active Stack:', 'TypeScript Monorepo, React Flow, Zustand, Monaco, Express, Drizzle, Stripe'],
  ['Repository URL:', 'https://github.com/mohdazhar2417-coder/Hackathon-Starter-Kit-M'],
  ['Reference Date:', 'May 17, 2026'],
  ['Target Audience:', 'Future Engineering Agents, Core Developers, Hackathon Jurors']
];

let metaY = 570;
for (const row of metaRows) {
  doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff').text(row[0], 60, metaY);
  doc.font('Helvetica').fontSize(8.5).fillColor('#cbd5e1').text(row[1], 180, metaY);
  metaY += 18;
}

// Glowing Handover pill
doc.rect(60, 720, 430, 30).fill('#1e293b');
doc.rect(60, 720, 3, 30).fill('#10b981');
doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#10b981').text('HANDOVER ENGINE READY: SOURCE CODE PARSED & ARCHITECTED', 75, 731);

// 6. INITIALIZE FIRST MAIN CONTENT PAGE (TOC)
doc.addPage();

H1('DOCUMENT TABLE OF CONTENTS');

const tocItems = [
  ['Section 1: Executive Summary & Core Product Concept', 'Page 3', 'High-level business & educational values, problem-solution statements, and TraceWise AI alignment.'],
  ['Section 2: Architecture Blueprint & Technical Stack', 'Page 4', 'A complete mapping of the pnpm monorepo layout, libraries, package dependencies, and sharing protocols.'],
  ['Section 3: Database & Drizzle Schema Dictionary', 'Page 5', 'Structured schema breakdown of PostgreSQL tables, fields, constraints, relations, and billing integrations.'],
  ['Section 4: The TraceWise AI Tracing & Simulation Engine', 'Page 6', 'Inner mechanisms of parser, tokenizer, symbolic executor, graph layout generator, and step calculator.'],
  ['Section 5: The LogicLens UI Workspace & Workspace Panels', 'Page 8', 'The 3-column command layout, Monaco Editor sync, React Flow flowchart node engine, and memory visualizer.'],
  ['Section 6: Complete Curriculum & Sample Program Library', 'Page 10', 'The structured five-category sample program catalog, data models, and core demo-critical tracing mappings.'],
  ['Section 7: Production Deployment & Split Config Blueprint', 'Page 11', 'Vercel frontend, Render backend, Neon DB pipelines, environment variables, and CORS policy mappings.'],
  ['Section 8: Future Development Roadmap & Developer Handover', 'Page 12', 'The developer playbook: How to add features, extend engines, and execute Phases 3 to 6 technical backlogs.']
];

for (const item of tocItems) {
  checkSpace(40);
  const curY = doc.y;
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.indigo).text(item[0], 50, curY);
  doc.font('Helvetica-Bold').fontSize(9.5).fillColor(colors.blue).text(item[1], 495, curY, { align: 'right', width: 50 });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8.5).fillColor(colors.slateText).text(item[2], 50, doc.y, { width: 495 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.slateBorder).lineWidth(0.5).stroke();
  doc.moveDown(0.5);
}

// ----------------------------------------------------
// SECTION 1: EXECUTIVE SUMMARY & CORE CONCEPT
// ----------------------------------------------------
doc.addPage();
H1('1. EXECUTIVE SUMMARY & CORE PRODUCT CONCEPT');

H2('1.1 The "Black Box" Problem in Coding Education');
P('When beginner students start learning Java, they struggle to visualize what happens behind the scenes. Standard IDEs run programs in a millisecond and spit out terminal outputs. This creates a "black box" where variables are magically updated, control loops are memorized, and conditional branches are misunderstood. Students struggle to trace the call stack, visual memory representations (JVM stack and heap), and arithmetic operations (especially core behaviors like Java integer division and loop boundary mutations).');

H2('1.2 The LogicLens Framework');
P('LogicLens bridges the cognitive gap between "writing code" and "understanding execution." It takes beginner-structured Java source code, parses it, executes it step-by-step in a sandboxed, state-driven virtual simulation engine (TraceWise AI), and renders a real-time visual playback. The execution is unrolled, making loop structures, condition jumps, output concatenation, and stack frames extremely explicit.');

Callout(
  'Core Tagline & Elevator Pitch',
  'LogicLens: See how beginner Java programs actually think.\nInstead of standard step-over debuggers, LogicLens decomposes every loop iteration, variable assignment, and division calculation into highly detailed, interactive, and beautifully unrolled flow models.',
  'info'
);

H2('1.3 Target Audience and Real-World Value');
Bullet('CS1 Students: Provides a visual model of assignments, loops, and pattern program execution.');
Bullet('Bootcamp Self-learners: Replaces manual paper-tracing of algorithms with real-time memory state visualization.');
Bullet('Educators: Serves as an interactive teaching whiteboard showing how variables evolve step-by-step.');
Bullet('Interview Candidates: Clarifies fundamental algorithms like prime number, palindrome check, and reverse arithmetic.');

// ----------------------------------------------------
// SECTION 2: ARCHITECTURE BLUEPRINT & TECHNICAL STACK
// ----------------------------------------------------
doc.addPage();
H1('2. ARCHITECTURE BLUEPRINT & TECHNICAL STACK');

H2('2.1 Monorepo Layout & System Structure');
P('LogicLens is structured as a pnpm monorepo. This allows shared types, schemas, and specs to reside in reusable packages, while separation of concerns is maintained between the frontend rendering layer and the backend Express database orchestrator.');

CodeBlock(
`logiclens-workspace/
├── frontend/                  # React Single Page App (Vite Dev Engine)
│   ├── src/
│   │   ├── engines/           # TraceWise AI Tracing Sub-systems
│   │   ├── components/        # React Flow canvas, Monaco Editor wrapper, Panels
│   │   ├── pages/             # Workspace, Landing, Auth, Dashboard, Admins
│   │   └── hooks/             # Zustand state management and queries
├── backend/                   # Express API Server (Node/TypeScript)
│   ├── src/
│   │   ├── controllers/       # Auth handlers, trace saving, billing controllers
│   │   └── index.ts           # Server initialization and routes
├── packages/                  # Shared local modules
│   ├── db/                    # Drizzle ORM schemas, pool configuration, migrations
│   ├── api-spec/              # Shared REST contracts
│   └── api-zod/               # Zod validation models
└── database/                  # Schema definition and drizzle.config`
);

H2('2.2 Shared Package Dependency Grid');
const depHeaders = ['Dependency Name', 'Primary Use Area', 'Description'];
const depRows = [
  ['React Flow v11', 'Frontend Workspace', 'Drives the interactive flowchart canvas, active node glowing, and loops.'],
  ['Monaco Editor React', 'Frontend Workspace', 'Fully-featured code editor with syntax highlighting and line indicators.'],
  ['Zustand', 'Frontend Client State', 'Syncs Code Editor line highlights, Timeline Scrubber, and Memory Grid.'],
  ['Framer Motion', 'Frontend UI', 'Drives the fluid Antigravity glassmorphic animations and transition states.'],
  ['Drizzle ORM', 'Backend / Database', 'Provides type-safe SQL construction and schema management for PostgreSQL.'],
  ['Stripe SDK', 'Backend Billing', 'Orchestrates premium user subscription plans, customer profiles, and webhooks.'],
  ['JWT & Passport.js', 'Backend Auth', 'Implements local signup/login authentication and Google OAuth 2.0.']
];
Table(depHeaders, depRows, [110, 110, 275]);

H2('2.3 Core Package Operations');
P('To manage the pnpm workspace efficiently, use the following core scripts:');
Bullet('Install all dependencies: "pnpm install" at the root workspace.');
Bullet('Run Dev Mode concurrently: "pnpm dev" launches frontend (5173) and backend API (5000) simultaneously.');
Bullet('Apply migrations: "pnpm db:push" pushes schema directly using Drizzle.');
Bullet('Build project: "pnpm build" compiles shared libraries, backend bundles, and frontend client assets.');

// ----------------------------------------------------
// SECTION 3: DATABASE & DRIZZLE SCHEMA DICTIONARY
// ----------------------------------------------------
doc.addPage();
H1('3. DATABASE & DRIZZLE SCHEMA DICTIONARY');

H2('3.1 Database Topology');
P('The persistence layer is powered by PostgreSQL (hosted in production on Neon DB, and simulated locally/in development using SQLite or memory tables). Drizzle ORM acts as the type-safe mapping layer, defining schemas as standard TypeScript files in the database module.');

H2('3.2 Schema Data Dictionary');

H3('1. Users Table (users)');
const userHeaders = ['Field Name', 'Type / Constraints', 'Default', 'Role / Details'];
const userRows = [
  ['id', 'serial (Primary Key)', 'nextval()', 'Unique internal user identifier.'],
  ['name', 'text (Not Null)', 'none', 'User profile name.'],
  ['email', 'text (Unique, Not Null)', 'none', 'Credentials email and billing key.'],
  ['password_hash', 'text (Not Null)', 'none', 'Securely hashed password (bcrypt).'],
  ['role', 'text (Not Null)', 'student', 'Role for authorization: "student" or "admin".'],
  ['stripe_customer_id', 'text (Nullable)', 'null', 'Connected Stripe account reference.'],
  ['subscription_status', 'text (Nullable)', 'none', 'Plan status: active, canceled, past_due, none.'],
  ['plan_type', 'text (Nullable)', 'free', 'Limits execution tracing allowance: free, pro, enterprise.'],
  ['created_at', 'timestamp with timezone', 'now()', 'Profile registration timestamp.']
];
Table(userHeaders, userRows, [100, 110, 75, 210]);

H3('2. Saved Traces Table (saved_traces)');
const traceHeaders = ['Field Name', 'Type / Constraints', 'Default', 'Role / Details'];
const traceRows = [
  ['id', 'serial (Primary Key)', 'nextval()', 'Trace identifier.'],
  ['user_id', 'integer (References users.id)', 'none', 'Foreign key identifying the trace owner.'],
  ['title', 'text (Not Null)', 'none', 'Human readable label for the saved simulation.'],
  ['category', 'text (Not Null)', 'none', 'Java curriculum group (e.g., Loops).'],
  ['subtype', 'text (Not Null)', 'none', 'Algorithm indicator (e.g., Palindrome).'],
  ['code', 'text (Not Null)', 'none', 'Raw Java code block input.'],
  ['custom_inputs', 'jsonb (Nullable)', 'null', 'User custom inputs (e.g., {"n": 12321}).'],
  ['trace_summary', 'text (Nullable)', 'null', 'AI-generated final calculation result summary.'],
  ['final_output', 'text (Nullable)', 'null', 'Emulated standard output (console log stream).'],
  ['saved_at', 'timestamp with timezone', 'now()', 'Trace persistence timestamp.'],
  ['share_slug', 'text (Unique, Nullable)', 'null', 'Slug for public sharing of execution traces.'],
  ['is_public', 'boolean (Not Null)', 'false', 'Flag for public access.']
];
Table(traceHeaders, traceRows, [85, 120, 65, 225]);

doc.addPage();
H3('3. Favorite Programs Table (favorite_programs)');
const favHeaders = ['Field Name', 'Type / Constraints', 'Default', 'Role / Details'];
const favRows = [
  ['id', 'serial (Primary Key)', 'nextval()', 'Unique favorite tracker record.'],
  ['user_id', 'integer (References users.id)', 'none', 'Active user owner ID.'],
  ['program_id', 'integer (Not Null)', 'none', 'Standard program library identifier.'],
  ['program_name', 'text (Not Null)', 'none', 'Cached sample program name.'],
  ['program_category', 'text (Not Null)', 'none', 'Cached category identifier.'],
  ['added_at', 'timestamp with timezone', 'now()', 'Addition timestamp.']
];
Table(favHeaders, favRows, [100, 110, 75, 210]);

H3('4. Sample Programs Catalog Table (sample_programs)');
const sampHeaders = ['Field Name', 'Type / Constraints', 'Default', 'Role / Details'];
const sampRows = [
  ['id', 'serial (Primary Key)', 'nextval()', 'Program library key.'],
  ['name', 'text (Not Null)', 'none', 'Name (e.g., Celsius to Fahrenheit).'],
  ['category', 'text (Not Null)', 'none', 'Educational category.'],
  ['subtype', 'text (Not Null)', 'none', 'Curriculum subtype.'],
  ['code', 'text (Not Null)', 'none', 'Pre-written beginner-level Java source.'],
  ['description', 'text (Not Null)', 'none', 'Step-by-step description of the algorithm.'],
  ['difficulty', 'text (Not Null)', 'beginner', 'Difficulty level: beginner, intermediate, advanced.'],
  ['featured', 'boolean (Not Null)', 'false', 'Showcase indicator for the dashboard slider.'],
  ['tags', 'text array (Not Null)', '[]', 'Keywords for category searching.'],
  ['created_at', 'timestamp with timezone', 'now()', 'Catalog generation date.']
];
Table(sampHeaders, sampRows, [85, 120, 65, 225]);

// ----------------------------------------------------
// SECTION 4: THE TRACEWISE AI ENGINE
// ----------------------------------------------------
doc.addPage();
H1('4. THE TRACEWISE AI TRACING & SIMULATION ENGINE');

H2('4.1 Tracing Pipeline Mechanics');
P('The custom simulation engine (located at frontend/src/engines/simulate/simulationEngine.ts) parses, normalizes, executes, and builds visualizations for structured Java code entirely in the sandbox environments. This design avoids server execution latency or malicious infinite-loop threats. The engine works in 5 synchronous steps:');

Bullet('Tokenization: Normalizes braces and semicolons; parses nested blocks, for headers, and while conditions.');
Bullet('Parsing: Converts tokens into structured statements (declarations, assignments, print commands, conditionals, loops).');
Bullet('Symbolic Execution: Steps through statements, updating a virtual environment and capturing memory states.');
Bullet('Graph Generation: Builds a graph representing control flow with nodes and edges for React Flow.');
Bullet('Explanation Compiling: Translates executing steps into educational text explanations and hints.');

H2('4.2 The Symbolic Execution Model');
P('The engine tracks variables using a "VariableState" object, capturing before and after states. It records calculation breakdowns for assignments, e.g., reversed * 10 + rem -> 0 * 10 + 1 = 1.');

CodeBlock(
`export interface ExecutionStep {
  stepIndex: number;
  stepNumber: number;
  lineNumber: number;
  type: "assignment" | "loop" | "condition" | "output" | "start" | "end";
  title: string;
  codeLine: string;
  description: string;
  beforeState: VariableState;
  afterState: VariableState;
  stateChanges: { varName: string; before: any; after: any }[];
  calculations: { expr: string; result: any }[];
  iteration?: number;
  nodeId: string;
  loopId?: string;
  accumulatedOutput: string;
  branchTaken?: "true" | "false";
  status: "completed" | "current" | "pending";
}`
);

H2('4.3 Real-World Java Semantics Mapping');
P('A major challenge in browser-based symbolic execution is replicating accurate Java semantics in a JavaScript environment. The LogicLens engine includes special workarounds for these edge cases:');

Callout(
  'Java Integer Division Emulation',
  'In Java, 5 / 2 yields 2 (truncating decimals), whereas in JavaScript, 5 / 2 yields 2.5. The simulation engine resolves this by parsing the expression and automatically wrapping division operands in integer checks, truncating decimal values when executing integer-defined division.',
  'success'
);

Callout(
  'Loop Iteration Unrolling',
  'Unlike standard debuggers that pause on a loop header, LogicLens flattens execution loops into discrete, iteration-indexed steps. This allows students to scrub backwards and forwards through individual iterations.',
  'success'
);

doc.addPage();
H2('4.4 Graph Construction and Layout');
P('The engine dynamically generates React Flow elements using two algorithms:');
H3('1. buildFlowNodes.ts');
P('Processes the flat syntax tree. Blocks are converted into nodes with visual labels: operation (rectangular), decision (diamond), loop (hexagonal), and input/output (parallelogram) nodes.');

H3('2. buildFlowEdges.ts');
P('Connects nodes sequentially. Loops include loop-back edges pointing to condition checks, labeled with iteration indicators. If-else branches generate edges labeled with "true" and "false" markers.');

Callout(
  'Active Node Highlights',
  'During execution, React Flow nodes are styled with neon green shadows representing execution status. Inactive paths are faded, visually demonstrating conditional jumps.',
  'info'
);

// ----------------------------------------------------
// SECTION 5: THE LOGICLENS UI WORKSPACE
// ----------------------------------------------------
doc.addPage();
H1('5. THE LOGICLENS UI WORKSPACE & WORKSPACE PANELS');

H2('5.1 The 3-Column Command Layout');
P('The workspace is optimized for educational clarity, presenting code, flowcharts, and memory in a single view:');

Bullet('Left (Code Editor): Monaco Editor wrapper. Synchronizes current execution steps, highlights lines, and auto-scrolls to keep active structures in focus.');
Bullet('Center (Execution Canvas): React Flow canvas displaying a real-time trace of the program structure.');
Bullet('Right (Memory Visualizer): Renders local stack frames, heap references, and variable updates. Updated variables flash with yellow neon accents.');

H2('5.2 Bottom Analysis Suite');
P('Below the 3-column layout, four analytics panels offer additional educational insights:');

H3('1. Emulated Terminal Console');
P('Displays character-by-character standard outputs, allowing students to trace how shapes are built line-by-line.');

H3('2. Loop Iteration Trace Table');
P('A structured table displaying variable changes for loop indices across iterations, replacing manual trace tables.');

H3('3. Onboarding Tour Wizard');
P('A guided tour using visual popups that highlights key controls like Step Forward, Step Back, and Custom Inputs.');

H3('4. Final Validation Banner');
P('Triggers at the end of execution, verifying the final outputs of algorithm checks (e.g., "Prime Verified").');

H2('5.3 Admin Command Center');
P('Admins can access a dashboard with metrics, usage overviews, featured program managers, and system control suites.');

Table(
  ['Admin Component', 'Access Level', 'Core Capabilities'],
  [
    ['Activity Log Tracker', 'Admin Only', 'Tracks user trace counts, custom program runs, and logins.'],
    ['Curriculum Manager', 'Admin Only', 'Allows admins to edit, update, delete, or add sample programs.'],
    ['Featured Switch', 'Admin Only', 'Pins successful programs to the dashboard carousel.'],
    ['Billing Metrics Drawer', 'Admin Only', 'Displays Stripe transaction summaries and plan lists.']
  ],
  [120, 80, 295]
);

// ----------------------------------------------------
// SECTION 6: CURRICULUM & PROGRAM LIBRARY
// ----------------------------------------------------
doc.addPage();
H1('6. COMPLETE CURRICULUM & SAMPLE PROGRAM LIBRARY');

H2('6.1 Standard Categories');
P('LogicLens organizes beginner Java programs into 5 distinct categories, covering typical introductory CS curriculum structures:');

Bullet('1. Basic Math & Input/Output: Celsius/Fahrenheit conversions, temp swaps, simple calculator structures.');
Bullet('2. Conditionals: Greatest of three numbers, leap year checks, digit vs special char validations.');
Bullet('3. Loop Structures: Factorials, sum of natural numbers, multiplication tables.');
Bullet('4. Number Logic Programs: Palindromes, Prime validations, Armstrong calculations, Fibonacci sequence.');
Bullet('5. Pattern Programs: Inverted pyramids, diamond patterns, Floyd\'s triangle, Pascal\'s triangle.');

H2('6.2 Mappings for Key Algorithms');
P('The following table outlines how standard algorithms map to visual nodes and variables:');

Table(
  ['Algorithm Name', 'Key Variables Tracked', 'Decision Nodes Created', 'Loop Nodes Created'],
  [
    ['Prime Number Check', 'num, temp, i, isPrime', 'num <= 1, num % i == 0', 'i * i <= num'],
    ['Palindrome Number', 'n, original, reversed, rem', 'original == reversed', 'n > 0'],
    ['Fibonacci Series', 'n, first, second, next, i', 'i < n', 'i = 2; i < n; i++'],
    ['Pyramid Stars', 'rows, i, space, j', 'space <= rows - i, j <= 2 * i - 1', 'i <= rows (Outer), Space & Star (Inner)']
  ],
  [110, 130, 135, 120]
);

Callout(
  'Demo-Critical Mappings',
  'These programs are thoroughly configured with pre-analyzed variables and explanation tips to showcase the full features of the visualization engine.',
  'success'
);

// ----------------------------------------------------
// SECTION 7: PRODUCTION DEPLOYMENT & SPLIT CONFIG
// ----------------------------------------------------
doc.addPage();
H1('7. PRODUCTION DEPLOYMENT & SPLIT CONFIG BLUEPRINT');

H2('7.1 Split-Platform Infrastructure Topology');
P('LogicLens is optimized for a split-platform deployment architecture, dividing frontend delivery from server processing:');
Bullet('Frontend Client Host: Vercel Static Web Hosting.');
Bullet('API Server Host: Render Web Services.');
Bullet('SQL Database Host: Neon Serverless PostgreSQL.');

H2('7.2 Critical Environment Configuration');
P('Ensure the following environment variables are set in production:');

CodeBlock(
`# ====================================================
# BACKEND API SERVER ENVIRONMENT (.env on Render)
# ====================================================
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://neondb_owner:***@ep-mute-wave.aws.neon.tech/logiclens
JWT_SECRET=super_secure_logiclens_infinite_token_system
FRONTEND_URL=https://logiclens-app.vercel.app
STRIPE_SECRET_KEY=sk_live_51M***
STRIPE_WEBHOOK_SECRET=whsec_***
GOOGLE_CLIENT_ID=***.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=***

# ====================================================
# FRONTEND CLIENT ENVIRONMENT (Vercel Variables)
# ====================================================
VITE_API_URL=https://logiclens-api.onrender.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_***`
);

H2('7.3 CORS & Authentication Policies');
P('To allow split authentication, the backend CORS setup must permit request origins matching the frontend deployment url:');

Callout(
  'CORS Credential Policies',
  'To support cookie-based sessions, CORS headers must set "credentials: true", and headers like "Access-Control-Allow-Origin" must specify the exact frontend url rather than the "*" wildcard.',
  'danger'
);

// ----------------------------------------------------
// SECTION 8: ROADMAP & TECHNICAL PLAYBOOK
// ----------------------------------------------------
doc.addPage();
H1('8. FUTURE DEVELOPMENT ROADMAP & PLAYBOOK');

H2('8.1 Developer Handover: Step-by-Step Guides');

H3('1. How to Add a Sample Program to the Catalog');
P('Create the program record inside the catalog library:');
CodeBlock(
`// Add program block inside database/src/seeds.ts
await db.insert(sampleProgramsTable).values({
  name: "Automorphic Number Check",
  category: "Number Logic Programs",
  subtype: "automorphic",
  code: "int num = 25;\\nint sq = num * num;\\nboolean isAutomorphic = true;\\n// check logic...",
  description: "Check if the square of a number ends with the number itself.",
  difficulty: "intermediate",
  tags: ["math", "number-logic", "automorphic"]
});`
);

H3('2. How to Extend the Tracing Parser');
P('To parse a new statement type (e.g., Array allocation `int[] arr = new int[5];`):');
Bullet('Step A: Define the Statement type in `simulationEngine.ts` inside the `Statement` union.');
Bullet('Step B: Add token matching rules to parse array declarations inside `parseStatement`.');
Bullet('Step C: Update `execStatement` to support local array memory layouts in `VariableState`.');

H2('8.2 Future Enhancement Roadmaps');

Callout(
  'Phase 3: Time-Travel & Reversible Debugging',
  'Implement a history queue: store the full VariableState diffs on each step. This allows developers to scrub backwards and restore memory variables instantaneously without reprocessing the simulation.',
  'warning'
);

Callout(
  'Phase 4: Power User Utilities',
  'Implement SVG and PNG export tools for the flowchart canvas. Create a speed control slider to adjust auto-play intervals from 0.5x to 4x.',
  'warning'
);

Callout(
  'Phase 5: AI Insights & Smart Tutoring',
  'Integrate the OpenAI/Anthropic SDKs into `/api/explain` to provide context-aware logic explanations and smart error detection for runtime failures.',
  'warning'
);

Callout(
  'Phase 6: Object-Oriented Visualizations',
  'Expand JVM memory tracking to visualize instantiated objects and reference pointers in the Heap panel, linked to Stack references.',
  'warning'
);

// ----------------------------------------------------
// 7. FINAL RETROACTIVE PAGE NUMBERING LOOP
// ----------------------------------------------------
const range = doc.bufferedPageRange();
for (let i = range.start + 1; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  
  // Page Header
  doc.save();
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.indigo).text('LOGICLENS SYSTEM REFERENCE MANUAL', 50, 28);
  doc.font('Helvetica').fontSize(7).fillColor(colors.slateText).text('POWERED BY TRACEWISE AI', 200, 28, { align: 'right', width: 345 });
  doc.moveTo(50, 38).lineTo(545, 38).strokeColor(colors.slateBorder).lineWidth(0.5).stroke();
  
  // Page Footer
  doc.moveTo(50, 792 - 45).lineTo(545, 792 - 45).strokeColor(colors.slateBorder).lineWidth(0.5).stroke();
  
  doc.font('Helvetica').fontSize(7).fillColor(colors.slateText)
     .text('Confidential - LogicLens Internal Handover Reference Document', 50, 792 - 35);
     
  doc.font('Helvetica-Bold').fontSize(7.5).fillColor(colors.indigo)
     .text(`Page ${i + 1} of ${range.count}`, 50, 792 - 35, { align: 'right', width: 495 });
  doc.restore();
}

// 8. Finalize the stream and save
doc.end();

console.log('PDF Compiled successfully at ' + outputFilePath);
