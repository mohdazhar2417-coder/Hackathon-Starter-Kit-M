export type Category =
  | "Basic I/O & Math"
  | "Conditionals"
  | "Loops"
  | "Number Logic"
  | "Pattern Programs"
  | "Unknown";

export interface DetectionResult {
  category: Category;
  confidence: number;
  subtype: string;
  supportLevel: "full" | "partial" | "unsupported";
}

function scoreCategory(code: string): Record<Category, number> {
  const scores: Record<Category, number> = {
    "Basic I/O & Math": 0,
    Conditionals: 0,
    Loops: 0,
    "Number Logic": 0,
    "Pattern Programs": 0,
    Unknown: 0,
  };

  const c = code.toLowerCase();

  // Conditionals
  if (/\bif\s*\(/.test(c)) scores["Conditionals"] += 3;
  if (/\belse\s+if\b/.test(c)) scores["Conditionals"] += 2;
  if (/\belse\b/.test(c)) scores["Conditionals"] += 1;
  if (/\bswitch\s*\(/.test(c)) scores["Conditionals"] += 3;

  // Loops
  if (/\bfor\s*\(/.test(c)) scores["Loops"] += 4;
  if (/\bwhile\s*\(/.test(c)) scores["Loops"] += 4;
  if (/\bdo\s*\{/.test(c)) scores["Loops"] += 3;

  // Pattern Programs (nested loops with print and star/space)
  const forCount = (c.match(/\bfor\s*[(]/g) ?? []).length;
  const whileCount = (c.match(/\bwhile\s*[(]/g) ?? []).length;
  const hasNestedLoop = forCount >= 2 || (forCount >= 1 && whileCount >= 1);
  if (hasNestedLoop) scores["Pattern Programs"] += 3;
  if (/\*|star|pattern/i.test(c)) scores["Pattern Programs"] += 2;
  if (/print\s*\(\s*"[\s\*#]/.test(c)) scores["Pattern Programs"] += 2;

  // Number Logic (palindrome, prime, fibonacci, armstrong, etc.)
  const numberLogicKeywords = [
    "palindrome", "prime", "fibonacci", "fib", "armstrong", "factorial",
    "reverse", "digit", "perfect", "strong", "neon", "spy", "automorphic", "duck",
  ];
  numberLogicKeywords.forEach((kw) => {
    if (c.includes(kw)) scores["Number Logic"] += 3;
  });
  if (/num\s*%\s*10/.test(c)) scores["Number Logic"] += 2;
  if (/reversed\s*=/.test(c)) scores["Number Logic"] += 2;

  // Basic I/O & Math
  if (/scanner/i.test(c)) scores["Basic I/O & Math"] += 2;
  if (/system\.out\.print/.test(c) && !hasNestedLoop) scores["Basic I/O & Math"] += 1;
  if (/int\s+a\s*=|double\s+/.test(c)) scores["Basic I/O & Math"] += 1;
  if (/\+|-|\*|\//.test(c)) scores["Basic I/O & Math"] += 1;

  // Loops boost over Conditionals if loops present
  if (scores["Loops"] > 2) {
    scores["Conditionals"] = Math.max(0, scores["Conditionals"] - 1);
  }

  return scores;
}

export function detectCategory(code: string): DetectionResult {
  const scores = scoreCategory(code);

  let bestCategory: Category = "Unknown";
  let bestScore = 0;
  let totalScore = 0;

  for (const [cat, score] of Object.entries(scores) as [Category, number][]) {
    totalScore += score;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = cat;
    }
  }

  const confidence = totalScore > 0 ? Math.min(100, Math.round((bestScore / totalScore) * 100 * 1.5)) : 50;

  const supportLevel: "full" | "partial" | "unsupported" =
    bestCategory === "Unknown" ? "unsupported" :
    confidence >= 60 ? "full" : "partial";

  return {
    category: bestCategory,
    confidence,
    subtype: detectSubtype(code, bestCategory),
    supportLevel,
  };
}

function detectSubtype(code: string, category: Category): string {
  const c = code.toLowerCase();
  switch (category) {
    case "Conditionals":
      if (/even.*odd|%\s*2/.test(c)) return "Even or Odd";
      if (/greatest.*3|max.*3/.test(c)) return "Greatest of 3 Numbers";
      if (/leap.*year/.test(c)) return "Leap Year";
      if (/grade|marks/.test(c)) return "Grade Calculator";
      if (/vowel|consonant/.test(c)) return "Vowel or Consonant";
      if (/positive|negative|zero/.test(c)) return "Positive/Negative/Zero";
      return "Conditional Logic";
    case "Loops":
      if (/factorial|fact/.test(c)) return "Factorial";
      if (/fibonacci|fib/.test(c)) return "Fibonacci Series";
      if (/multiplication.*table|table/.test(c)) return "Multiplication Table";
      if (/sum.*natural|natural.*sum/.test(c)) return "Sum of N Natural Numbers";
      if (/pattern|\*/.test(c)) return "Pattern Program";
      if (/reverse/.test(c)) return "Reverse Counting";
      return "Loop Program";
    case "Number Logic":
      if (/palindrome/.test(c)) return "Palindrome Number";
      if (/prime/.test(c)) return "Prime Number";
      if (/fibonacci|fib/.test(c)) return "Fibonacci Series";
      if (/armstrong/.test(c)) return "Armstrong Number";
      if (/perfect/.test(c)) return "Perfect Number";
      if (/strong/.test(c)) return "Strong Number";
      return "Number Logic";
    case "Pattern Programs":
      if (/pyramid/.test(c)) return "Pyramid Pattern";
      if (/triangle/.test(c)) return "Triangle Pattern";
      if (/diamond/.test(c)) return "Diamond Pattern";
      if (/square/.test(c)) return "Square Pattern";
      return "Pattern Program";
    case "Basic I/O & Math":
      if (/scanner/.test(c)) return "Input/Output Program";
      if (/interest/.test(c)) return "Simple Interest";
      if (/celsius|fahrenheit/.test(c)) return "Temperature Conversion";
      if (/area/.test(c)) return "Area Calculation";
      if (/sum|add/.test(c)) return "Addition";
      if (/swap/.test(c)) return "Swap Numbers";
      return "Math Program";
    default:
      return "Unknown Program";
  }
}
