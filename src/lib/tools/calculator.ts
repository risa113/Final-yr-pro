/**
 * Safe Mathematical Calculator Tool
 * Evaluates mathematical expressions with high precision without using dangerous eval().
 */

export interface CalculatorResult {
  expression: string;
  result: number | string;
  success: boolean;
  error?: string;
}

export function evaluateMathExpression(rawExpr: string): CalculatorResult {
  try {
    // Sanitize input - allow only numbers, math operators, parentheses, common math functions
    let expr = rawExpr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/\^/g, "**")
      .replace(/sqrt\(/g, "Math.sqrt(")
      .replace(/sin\(/g, "Math.sin(")
      .replace(/cos\(/g, "Math.cos(")
      .replace(/tan\(/g, "Math.tan(")
      .replace(/log\(/g, "Math.log10(")
      .replace(/ln\(/g, "Math.log(")
      .replace(/abs\(/g, "Math.abs(")
      .replace(/pi/gi, "Math.PI")
      .replace(/e\b/gi, "Math.E");

    // Strictly validate characters
    if (!/^[0-9+\-*/().,MathPIE\s]+$/.test(expr)) {
      return {
        expression: rawExpr,
        result: "",
        success: false,
        error: "Expression contains unsupported characters or functions.",
      };
    }

    // Safely evaluate using Function constructor with restricted scope
    const compute = new Function("Math", `"use strict"; return (${expr});`);
    const val = compute(Math);

    if (typeof val !== "number" || isNaN(val) || !isFinite(val)) {
      return {
        expression: rawExpr,
        result: isNaN(val) ? "NaN" : "Infinity",
        success: false,
        error: "Computation resulted in non-finite value or division by zero.",
      };
    }

    // Round to 8 decimal places for clean display
    const formatted = Math.abs(val) < 1e-6 && val !== 0 ? val.toExponential(4) : Number(val.toFixed(8)).toString();

    return {
      expression: rawExpr,
      result: formatted,
      success: true,
    };
  } catch (err: any) {
    return {
      expression: rawExpr,
      result: "",
      success: false,
      error: err.message || "Failed to parse mathematical expression.",
    };
  }
}
