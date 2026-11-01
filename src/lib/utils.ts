import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCalories(cal: number): string {
  return Math.round(cal).toLocaleString();
}

export function formatGrams(g: number): string {
  return g % 1 === 0 ? g.toFixed(0) : g.toFixed(1);
}

export function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
