import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Simple utility to concatenate class names conditionally.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
