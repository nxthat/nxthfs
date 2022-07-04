import { printf } from "https://deno.land/std@0.142.0/fmt/printf.ts";
import { blue, red, cyan } from "https://deno.land/std@0.146.0/fmt/colors.ts";

// deno-lint-ignore no-explicit-any
export function info(fmt: string, ...args: any[]) {
  const now = new Date();
  const pre_fmt = blue(`[INFO  ${now.toISOString()}]`)
  printf(`${pre_fmt} ${fmt}\n`, ...args);
}

// deno-lint-ignore no-explicit-any
export function error(fmt: string, ...args: any[]) {
  const now = new Date();
  const pre_fmt = red(`[ERROR ${now.toISOString()}]`)
  printf(`${pre_fmt} ${fmt}\n`, ...args);
}

// deno-lint-ignore no-explicit-any
export function debug(fmt: string, ...args: any[]) {
  const now = new Date();
  const pre_fmt = cyan(`[DEBUG ${now.toISOString()}]`)
  printf(`${pre_fmt} ${fmt}\n`, ...args);
}
