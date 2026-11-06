/**
 * Central Tool Registry & Dispatcher
 */

import { evaluateMathExpression } from "./calculator";
import { convertUnits } from "./unit-converter";
import { getCurrentDateTime, calculateDateDifference } from "./datetime";
import { performWebSearch } from "./web-search";
import { queryNutritionDatabase } from "./nutrition-tool";
import { extractRelevantChunks, processTextDocument } from "./document-processor";

export interface ToolExecutionRecord {
  toolName: string;
  input: string;
  output: string;
  success: boolean;
  timestamp: string;
}

export async function executeToolByName(
  name: string,
  params: Record<string, any>
): Promise<ToolExecutionRecord> {
  const timestamp = new Date().toISOString();

  switch (name) {
    case "calculator": {
      const expr = params.expression || params.expr || "";
      const calc = evaluateMathExpression(expr);
      return {
        toolName: "calculator",
        input: expr,
        output: calc.success ? `${expr} = ${calc.result}` : `Error: ${calc.error}`,
        success: calc.success,
        timestamp,
      };
    }

    case "unit_converter": {
      const val = Number(params.value) || 0;
      const res = convertUnits(val, params.fromUnit || "", params.toUnit || "");
      if ("error" in res) {
        return {
          toolName: "unit_converter",
          input: `${val} ${params.fromUnit} -> ${params.toUnit}`,
          output: `Error: ${res.error}`,
          success: false,
          timestamp,
        };
      }
      return {
        toolName: "unit_converter",
        input: `${val} ${params.fromUnit} -> ${params.toUnit}`,
        output: res.formatted,
        success: true,
        timestamp,
      };
    }

    case "datetime": {
      const dt = getCurrentDateTime(params.timeZone || "UTC");
      return {
        toolName: "datetime",
        input: params.timeZone || "UTC",
        output: `Current date/time: ${dt.formattedLocal} (${dt.dayOfWeek}, UTC ${dt.utcDate} ${dt.utcTime})`,
        success: true,
        timestamp,
      };
    }

    case "web_search": {
      const query = params.query || "";
      const searchRes = await performWebSearch(query);
      let outputText = searchRes.notes || "";
      if (searchRes.results.length > 0) {
        outputText = searchRes.results
          .map((r, i) => `[${i + 1}] "${r.title}": ${r.snippet} (Source: ${r.url})`)
          .join("\n\n");
      }
      return {
        toolName: "web_search",
        input: query,
        output: outputText,
        success: searchRes.success,
        timestamp,
      };
    }

    case "nutrition_db": {
      const foodQuery = params.query || params.food || "";
      const nutRes = await queryNutritionDatabase(foodQuery);
      return {
        toolName: "nutrition_db",
        input: foodQuery,
        output: nutRes.summary,
        success: nutRes.matched,
        timestamp,
      };
    }

    default:
      return {
        toolName: name,
        input: JSON.stringify(params),
        output: `Tool '${name}' is not registered or supported in this runtime.`,
        success: false,
        timestamp,
      };
  }
}
