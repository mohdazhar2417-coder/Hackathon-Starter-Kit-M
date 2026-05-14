
import { simulate } from './frontend/src/engines/simulate/simulationEngine';
import fs from 'fs';

const code = `public class MultiTable {
  public static void main(String[] args) {
    int n = 5;
    for (int i = 1; i <= 10; i++) {
      System.out.println(n + " x " + i + " = " + (n * i));
    }
  }
}`;

const result = simulate(code, {});
console.log("SIMULATION STEPS:");
result.steps.slice(0, 10).forEach((s, i) => {
  console.log(`Step ${i}: Node=${s.nodeId}, Line=${s.lineNumber}, Title=${s.title}`);
});
