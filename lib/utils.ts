import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { nanoid } from "nanoid";

/**
 * Merges Tailwind CSS classes with proper conflict resolution.
 * Uses clsx for conditional class names and tailwind-merge to handle conflicts.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string with conflicts resolved
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a festive order ID with HOHOHO prefix.
 * Uses nanoid for the unique suffix to ensure collision resistance.
 *
 * @returns A unique order identifier in the format HOHOHO-XXXXXXXXXX
 */
export function generateOrderId(): string {
  return `HOHOHO-${nanoid(10).toUpperCase()}`;
}

/**
 * Generates a batch ID with BATCH prefix.
 * Uses nanoid for the unique suffix to ensure collision resistance.
 *
 * @returns A unique batch identifier in the format BATCH-XXXXXXXXXX
 */
export function generateBatchId(): string {
  return `BATCH-${nanoid(10).toUpperCase()}`;
}

/**
 * Generates a selection ID with SEL prefix.
 * Uses nanoid for the unique suffix to ensure collision resistance.
 *
 * @returns A unique selection identifier in the format SEL-XXXXXXXXXX
 */
export function generateSelectionId(): string {
  return `SEL-${nanoid(10).toUpperCase()}`;
}

/**
 * Formats a number as USD currency.
 *
 * @param amount - The amount in USD to format
 * @returns Formatted currency string (e.g., "$49.99")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

/**
 * Formats an ISO date string for display.
 *
 * @param dateStr - ISO date string to format
 * @returns Formatted date string (e.g., "Dec 14, 2025")
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
