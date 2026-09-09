import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function formatRelativeTime(value: string | null) {
  if (!value) return "—";
  const diff = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (Math.abs(diff) < 1) return "just now";
  if (diff > 0) return `${diff}m ago`;
  return `in ${Math.abs(diff)}m`;
}
