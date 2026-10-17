import { NextResponse } from "next/server";
import { quote } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const SAMPLE = [
  { sku: "TEE-01", unitPriceCents: 2500, quantity: 2 },
  { sku: "CAP-02", unitPriceCents: 1800, quantity: 1 },
];

function parseFrames(stack = ""): { file: string; line: number; function: string }[] {
  return stack
    .split("\n")
    .slice(1)
    .map((l) => l.trim().match(/^at (?:(.+?) \()?(.+?):(\d+):\d+\)?$/))
    .filter((m): m is RegExpMatchArray => Boolean(m))
    .map((m) => ({ function: m[1] ?? "<anonymous>", file: m[2], line: Number(m[3]) }))
    .slice(0, 10);
}

export async function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? "local";
  try {
    const q = quote(SAMPLE, { percent: 10 });
    if (q.totalCents !== 6120) throw new Error(Pricing invariant failed: expected 6120, got );
    return NextResponse.json({ ok: true, sha, checks: { pricing: "ok" } });
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    return NextResponse.json(
      {
        ok: false,
        sha,
        error: { type: e.name, message: e.message, frames: parseFrames(e.stack) },
        hint: { file: "lib/pricing.ts", function: "applyDiscount" },
      },
      { status: 500 },
    );
  }
}
