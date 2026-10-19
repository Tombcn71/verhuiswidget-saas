import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-klassen samenvoegen (shadcn/ui): latere klassen winnen bij conflicten. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
