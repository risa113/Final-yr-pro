"use client";

import React, { useState } from "react";
import {
  Calculator,
  Search,
  Database,
  Calendar,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
} from "lucide-react";
import { ToolExecutionRecord } from "@/lib/tools";

interface ToolExecutionBadgeProps {
  tool: ToolExecutionRecord;
}

export function ToolExecutionBadge({ tool }: ToolExecutionBadgeProps) {
  const [expanded, setExpanded] = useState(false);

  const getIcon = () => {
    switch (tool.toolName) {
      case "calculator":
        return <Calculator className="w-3.5 h-3.5 text-blue-500" />;
      case "web_search":
        return <Search className="w-3.5 h-3.5 text-amber-500" />;
      case "nutrition_db":
        return <Database className="w-3.5 h-3.5 text-emerald-500" />;
      case "datetime":
        return <Calendar className="w-3.5 h-3.5 text-purple-500" />;
      case "unit_converter":
        return <Scale className="w-3.5 h-3.5 text-indigo-500" />;
      default:
        return <Sparkles className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getLabel = () => {
    switch (tool.toolName) {
      case "calculator":
        return "Calculator executed";
      case "web_search":
        return "Web search verified";
      case "nutrition_db":
        return "ICMR-NIN / USDA query";
      case "datetime":
        return "Time clock verified";
      case "unit_converter":
        return "Unit conversion computed";
      default:
        return `Tool: ${tool.toolName}`;
    }
  };

  return (
    <div className="my-2 border border-slate-200 rounded-xl bg-slate-50/80 overflow-hidden text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-slate-700 hover:bg-slate-100/80 transition-colors text-left font-medium cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{getLabel()}</span>
          <span className="text-[11px] text-slate-400 font-mono">({tool.input})</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px]">{expanded ? "Hide" : "Details"}</span>
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3.5 py-2.5 border-t border-slate-200 bg-white text-slate-600 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
          {tool.output}
        </div>
      )}
    </div>
  );
}
