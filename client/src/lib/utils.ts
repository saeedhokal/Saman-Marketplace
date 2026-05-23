import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitial(...parts: Array<string | null | undefined>): string {
  for (const part of parts) {
    if (!part) continue;
    const trimmed = part.trim();
    if (!trimmed) continue;
    const ch = Array.from(trimmed)[0];
    if (!ch) continue;
    return ch.toLocaleUpperCase();
  }
  return "";
}
