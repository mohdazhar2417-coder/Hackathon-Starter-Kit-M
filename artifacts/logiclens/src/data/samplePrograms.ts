export interface SampleProgram {
  id: number;
  name: string;
  category: string;
  subtype: string;
  code: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  featured: boolean;
  tags: string[];
  defaultInputs?: Record<string, number | string>;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  // Basic I/O & Math
  {
    id: 101, name: "Hello World", category: "Basic I/O & Math", subtype: "hello-world",
    difficulty: "beginner", featured: false, tags: ["output", "beginner"],
    description: "The classic first program that prints Hello, World! to the screen.",
    code: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  {
    id: 102, name: "Addition of 2 Numbers", category: "Basic I/O & Math", subtype: "addition",
    difficulty: "beginner", featured: false, tags: ["arithmetic", "variables"],
    description: "Add two numbers and print the result.",
    defaultInputs: { a: 5, b: 3 },
    code: `public class Addition {
    public static void main(String[] args) {
        int a = 5;
        int b = 3;
        int sum = a + b;
        System.out.println("Sum = " + sum);
    }
}`,
  },
  {
    id: 103, name: "Swap Two Numbers", category: "Basic I/O & Math", subtype: "swap",
    difficulty: "beginner", featured: false, tags: ["swap", "variables"],
    description: "Swap two variables using a temporary variable.",
    defaultInputs: { a: 10, b: 20 },
    code: `public class Swap {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;
        int temp = a;
        a = b;
        b = temp;
        System.out.println("a = " + a);
        System.out.println("b = " + b);
    }
}`,
  },
  {
    id: 104, name: "Area of Circle", category: "Basic I/O & Math", subtype: "area-circle",
    difficulty: "beginner", featured: false, tags: ["math", "arithmetic"],
    description: "Calculate the area of a circle given its radius.",
    defaultInputs: { radius: 7 },
    code: `public class AreaCircle {
    public static void main(String[] args) {
        double radius = 7;
        double area = 3.14159 * radius * radius;
        System.out.println("Area = " + area);
    }
}`,
  },
  {
    id: 105, name: "Celsius to Fahrenheit", category: "Basic I/O & Math", subtype: "celsius-fahrenheit",
    difficulty: "beginner", featured: false, tags: ["conversion", "math"],
    description: "Convert temperature from Celsius to Fahrenheit.",
    defaultInputs: { celsius: 100 },
    code: `public class CelsiusToFahrenheit {
    public static void main(String[] args) {
        double celsius = 100;
        double fahrenheit = (celsius * 9 / 5) + 32;
        System.out.println(celsius + " C = " + fahrenheit + " F");
    }
}`,
  },
  {
    id: 106, name: "Simple Interest", category: "Basic I/O & Math", subtype: "simple-interest",
    difficulty: "beginner", featured: false, tags: ["math", "finance"],
    description: "Calculate simple interest using principal, rate, and time.",
    defaultInputs: { principal: 1000, rate: 5, time: 2 },
    code: `public class SimpleInterest {
    public static void main(String[] args) {
        double principal = 1000;
        double rate = 5;
        double time = 2;
        double interest = (principal * rate * time) / 100;
        System.out.println("Simple Interest = " + interest);
    }
}`,
  },
  // Conditionals
  {
    id: 201, name: "Even or Odd", category: "Conditionals", subtype: "even-odd",
    difficulty: "beginner", featured: true, tags: ["modulo", "if-else", "decision"],
    description: "Check whether a number is even or odd using the modulo operator.",
    defaultInputs: { num: 7 },
    code: `public class EvenOdd {
    public static void main(String[] args) {
        int num = 7;
        if (num % 2 == 0) {
            System.out.println(num + " is Even");
        } else {
            System.out.println(num + " is Odd");
        }
    }
}`,
  },
  {
    id: 202, name: "Positive, Negative or Zero", category: "Conditionals", subtype: "pos-neg-zero",
    difficulty: "beginner", featured: false, tags: ["if-else", "comparison"],
    description: "Check if a number is positive, negative, or zero.",
    defaultInputs: { num: -5 },
    code: `public class PosNegZero {
    public static void main(String[] args) {
        int num = -5;
        if (num > 0) {
            System.out.println("Positive");
        } else if (num < 0) {
            System.out.println("Negative");
        } else {
            System.out.println("Zero");
        }
    }
}`,
  },
  {
    id: 203, name: "Greatest of 3 Numbers", category: "Conditionals", subtype: "greatest-3",
    difficulty: "beginner", featured: true, tags: ["if-else", "comparison", "nested"],
    description: "Find the greatest among three numbers using nested if-else.",
    defaultInputs: { a: 12, b: 45, c: 23 },
    code: `public class Greatest3 {
    public static void main(String[] args) {
        int a = 12;
        int b = 45;
        int c = 23;
        if (a >= b && a >= c) {
            System.out.println("Greatest = " + a);
        } else if (b >= a && b >= c) {
            System.out.println("Greatest = " + b);
        } else {
            System.out.println("Greatest = " + c);
        }
    }
}`,
  },
  {
    id: 204, name: "Leap Year", category: "Conditionals", subtype: "leap-year",
    difficulty: "beginner", featured: false, tags: ["if-else", "modulo"],
    description: "Check whether a given year is a leap year.",
    defaultInputs: { year: 2024 },
    code: `public class LeapYear {
    public static void main(String[] args) {
        int year = 2024;
        if ((year % 4 == 0 && year % 100 != 0) || year % 400 == 0) {
            System.out.println(year + " is a Leap Year");
        } else {
            System.out.println(year + " is not a Leap Year");
        }
    }
}`,
  },
  {
    id: 205, name: "Grade Calculator", category: "Conditionals", subtype: "grade-calc",
    difficulty: "beginner", featured: false, tags: ["if-else", "grading"],
    description: "Calculate the grade based on marks obtained.",
    defaultInputs: { marks: 75 },
    code: `public class GradeCalc {
    public static void main(String[] args) {
        int marks = 75;
        char grade;
        if (marks >= 90) {
            grade = 'A';
        } else if (marks >= 80) {
            grade = 'B';
        } else if (marks >= 70) {
            grade = 'C';
        } else if (marks >= 60) {
            grade = 'D';
        } else {
            grade = 'F';
        }
        System.out.println("Grade: " + grade);
    }
}`,
  },
  {
    id: 206, name: "Voting Eligibility", category: "Conditionals", subtype: "voting",
    difficulty: "beginner", featured: false, tags: ["if-else", "comparison"],
    description: "Check if a person is eligible to vote based on age.",
    defaultInputs: { age: 20 },
    code: `public class VotingEligibility {
    public static void main(String[] args) {
        int age = 20;
        if (age >= 18) {
            System.out.println("Eligible to vote");
        } else {
            System.out.println("Not eligible to vote");
        }
    }
}`,
  },
  // Loops
  {
    id: 301, name: "Print 1 to N", category: "Loops", subtype: "print-1-n",
    difficulty: "beginner", featured: false, tags: ["for-loop", "iteration"],
    description: "Print numbers from 1 to N using a for loop.",
    defaultInputs: { n: 10 },
    code: `public class Print1ToN {
    public static void main(String[] args) {
        int n = 10;
        for (int i = 1; i <= n; i++) {
            System.out.println(i);
        }
    }
}`,
  },
  {
    id: 302, name: "Sum of N Natural Numbers", category: "Loops", subtype: "sum-n",
    difficulty: "beginner", featured: true, tags: ["for-loop", "sum", "accumulator"],
    description: "Calculate the sum of first N natural numbers using a loop.",
    defaultInputs: { n: 10 },
    code: `public class SumNatural {
    public static void main(String[] args) {
        int n = 10;
        int sum = 0;
        for (int i = 1; i <= n; i++) {
            sum = sum + i;
        }
        System.out.println("Sum = " + sum);
    }
}`,
  },
  {
    id: 303, name: "Factorial", category: "Loops", subtype: "factorial",
    difficulty: "beginner", featured: true, tags: ["for-loop", "factorial", "multiplication"],
    description: "Calculate the factorial of a number using a for loop.",
    defaultInputs: { n: 5 },
    code: `public class Factorial {
    public static void main(String[] args) {
        int n = 5;
        int fact = 1;
        for (int i = 1; i <= n; i++) {
            fact = fact * i;
        }
        System.out.println(n + "! = " + fact);
    }
}`,
  },
  {
    id: 304, name: "Multiplication Table", category: "Loops", subtype: "mult-table",
    difficulty: "beginner", featured: true, tags: ["for-loop", "multiplication", "table"],
    description: "Print the multiplication table of a given number.",
    defaultInputs: { n: 5 },
    code: `public class MultiTable {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= 10; i++) {
            System.out.println(n + " x " + i + " = " + (n * i));
        }
    }
}`,
  },
  {
    id: 305, name: "Even Numbers in Range", category: "Loops", subtype: "even-range",
    difficulty: "beginner", featured: false, tags: ["for-loop", "modulo"],
    description: "Print all even numbers between 1 and N.",
    defaultInputs: { n: 20 },
    code: `public class EvenRange {
    public static void main(String[] args) {
        int n = 20;
        for (int i = 2; i <= n; i = i + 2) {
            System.out.println(i);
        }
    }
}`,
  },
  {
    id: 306, name: "Sum of Digits", category: "Loops", subtype: "sum-digits",
    difficulty: "beginner", featured: false, tags: ["while-loop", "modulo", "digits"],
    description: "Find the sum of all digits of a number.",
    defaultInputs: { num: 12345 },
    code: `public class SumDigits {
    public static void main(String[] args) {
        int num = 12345;
        int sum = 0;
        while (num > 0) {
            int digit = num % 10;
            sum = sum + digit;
            num = num / 10;
        }
        System.out.println("Sum of digits = " + sum);
    }
}`,
  },
  // Number Logic
  {
    id: 401, name: "Palindrome Number", category: "Number Logic", subtype: "palindrome",
    difficulty: "intermediate", featured: true, tags: ["while-loop", "modulo", "reverse"],
    description: "Check if a number is a palindrome by reversing its digits.",
    defaultInputs: { num: 12321 },
    code: `public class Palindrome {
    public static void main(String[] args) {
        int num = 12321;
        int original = num;
        int reversed = 0;
        while (num > 0) {
            int digit = num % 10;
            reversed = reversed * 10 + digit;
            num = num / 10;
        }
        if (original == reversed) {
            System.out.println(original + " is Palindrome");
        } else {
            System.out.println(original + " is not Palindrome");
        }
    }
}`,
  },
  {
    id: 402, name: "Prime Number", category: "Number Logic", subtype: "prime",
    difficulty: "intermediate", featured: true, tags: ["for-loop", "modulo", "prime"],
    description: "Check if a number is prime by testing divisibility.",
    defaultInputs: { num: 17 },
    code: `public class PrimeNumber {
    public static void main(String[] args) {
        int num = 17;
        boolean isPrime = true;
        if (num <= 1) {
            isPrime = false;
        }
        for (int i = 2; i <= num / 2; i++) {
            if (num % i == 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            System.out.println(num + " is Prime");
        } else {
            System.out.println(num + " is not Prime");
        }
    }
}`,
  },
  {
    id: 403, name: "Fibonacci Series", category: "Number Logic", subtype: "fibonacci",
    difficulty: "intermediate", featured: true, tags: ["for-loop", "fibonacci", "sequence"],
    description: "Print the Fibonacci series up to N terms.",
    defaultInputs: { n: 10 },
    code: `public class Fibonacci {
    public static void main(String[] args) {
        int n = 10;
        int a = 0;
        int b = 1;
        System.out.print(a + " " + b);
        for (int i = 2; i < n; i++) {
            int c = a + b;
            System.out.print(" " + c);
            a = b;
            b = c;
        }
        System.out.println();
    }
}`,
  },
  {
    id: 404, name: "Reverse Number", category: "Number Logic", subtype: "reverse",
    difficulty: "beginner", featured: false, tags: ["while-loop", "modulo", "reverse"],
    description: "Reverse the digits of a given number.",
    defaultInputs: { num: 12345 },
    code: `public class ReverseNumber {
    public static void main(String[] args) {
        int num = 12345;
        int reversed = 0;
        while (num > 0) {
            int digit = num % 10;
            reversed = reversed * 10 + digit;
            num = num / 10;
        }
        System.out.println("Reversed = " + reversed);
    }
}`,
  },
  {
    id: 405, name: "Armstrong Number", category: "Number Logic", subtype: "armstrong",
    difficulty: "intermediate", featured: false, tags: ["while-loop", "power", "digits"],
    description: "Check if a number is an Armstrong (narcissistic) number.",
    defaultInputs: { num: 153 },
    code: `public class Armstrong {
    public static void main(String[] args) {
        int num = 153;
        int original = num;
        int sum = 0;
        while (num > 0) {
            int digit = num % 10;
            sum = sum + digit * digit * digit;
            num = num / 10;
        }
        if (sum == original) {
            System.out.println(original + " is Armstrong");
        } else {
            System.out.println(original + " is not Armstrong");
        }
    }
}`,
  },
  {
    id: 406, name: "Perfect Number", category: "Number Logic", subtype: "perfect",
    difficulty: "intermediate", featured: false, tags: ["for-loop", "divisors", "sum"],
    description: "Check if a number equals the sum of its proper divisors.",
    defaultInputs: { num: 28 },
    code: `public class PerfectNumber {
    public static void main(String[] args) {
        int num = 28;
        int sum = 0;
        for (int i = 1; i < num; i++) {
            if (num % i == 0) {
                sum = sum + i;
            }
        }
        if (sum == num) {
            System.out.println(num + " is a Perfect number");
        } else {
            System.out.println(num + " is not a Perfect number");
        }
    }
}`,
  },
  {
    id: 407, name: "Strong Number", category: "Number Logic", subtype: "strong",
    difficulty: "intermediate", featured: false, tags: ["while-loop", "factorial", "digits"],
    description: "Check if a number equals the sum of factorials of its digits.",
    defaultInputs: { num: 145 },
    code: `public class StrongNumber {
    public static void main(String[] args) {
        int num = 145;
        int original = num;
        int sum = 0;
        while (num > 0) {
            int digit = num % 10;
            int fact = 1;
            for (int i = 1; i <= digit; i++) {
                fact = fact * i;
            }
            sum = sum + fact;
            num = num / 10;
        }
        if (sum == original) {
            System.out.println(original + " is a Strong number");
        } else {
            System.out.println(original + " is not a Strong number");
        }
    }
}`,
  },
  // Pattern Programs
  {
    id: 501, name: "Right Triangle Star Pattern", category: "Pattern Programs", subtype: "right-triangle",
    difficulty: "intermediate", featured: true, tags: ["nested-loops", "pattern", "stars"],
    description: "Print a right-angled triangle pattern using nested loops.",
    defaultInputs: { n: 5 },
    code: `public class RightTriangle {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }
}`,
  },
  {
    id: 502, name: "Pyramid Pattern", category: "Pattern Programs", subtype: "pyramid",
    difficulty: "intermediate", featured: true, tags: ["nested-loops", "pattern", "pyramid"],
    description: "Print a pyramid pattern with stars using nested loops.",
    defaultInputs: { n: 5 },
    code: `public class Pyramid {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= n; i++) {
            for (int j = i; j < n; j++) {
                System.out.print(" ");
            }
            for (int k = 1; k <= (2 * i - 1); k++) {
                System.out.print("*");
            }
            System.out.println();
        }
    }
}`,
  },
  {
    id: 503, name: "Square Pattern", category: "Pattern Programs", subtype: "square",
    difficulty: "beginner", featured: false, tags: ["nested-loops", "pattern"],
    description: "Print a square pattern of stars.",
    defaultInputs: { n: 5 },
    code: `public class SquarePattern {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                System.out.print("* ");
            }
            System.out.println();
        }
    }
}`,
  },
  {
    id: 504, name: "Number Triangle", category: "Pattern Programs", subtype: "number-triangle",
    difficulty: "intermediate", featured: false, tags: ["nested-loops", "numbers", "pattern"],
    description: "Print a triangle pattern using row numbers.",
    defaultInputs: { n: 5 },
    code: `public class NumberTriangle {
    public static void main(String[] args) {
        int n = 5;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print(j + " ");
            }
            System.out.println();
        }
    }
}`,
  },
  {
    id: 505, name: "Floyd's Triangle", category: "Pattern Programs", subtype: "floyds",
    difficulty: "intermediate", featured: false, tags: ["nested-loops", "numbers", "pattern"],
    description: "Print Floyd's triangle with consecutive numbers.",
    defaultInputs: { n: 5 },
    code: `public class FloydsTriangle {
    public static void main(String[] args) {
        int n = 5;
        int num = 1;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print(num + " ");
                num++;
            }
            System.out.println();
        }
    }
}`,
  },
];

export const CATEGORIES = [
  { name: "Basic I/O & Math", icon: "Calculator", description: "Input/output operations and arithmetic", color: "from-blue-500 to-cyan-500" },
  { name: "Conditionals", icon: "GitBranch", description: "If/else logic and decision branches", color: "from-purple-500 to-pink-500" },
  { name: "Loops", icon: "RefreshCw", description: "For loops, while loops, iteration", color: "from-green-500 to-emerald-500" },
  { name: "Number Logic", icon: "Hash", description: "Palindromes, primes, Fibonacci", color: "from-orange-500 to-red-500" },
  { name: "Pattern Programs", icon: "Grid3X3", description: "Star and number patterns", color: "from-yellow-500 to-orange-500" },
];

export function getProgramsByCategory(category: string): SampleProgram[] {
  return SAMPLE_PROGRAMS.filter((p) => p.category === category);
}

export function getFeaturedPrograms(): SampleProgram[] {
  return SAMPLE_PROGRAMS.filter((p) => p.featured);
}

export function getProgramById(id: number): SampleProgram | undefined {
  return SAMPLE_PROGRAMS.find((p) => p.id === id);
}
