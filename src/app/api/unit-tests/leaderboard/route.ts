import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { UnitKey } from "@/lib/unit-test-content";

function parseUnitKey(raw: unknown): UnitKey | null {
  const v = typeof raw === "string" ? raw : "";
  if (
    v === "finance-fundamentals" ||
    v === "investing-basics" ||
    v === "financial-analysis" ||
    v === "personal-finance"
  ) {
    return v as UnitKey;
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const unitKey = parseUnitKey(url.searchParams.get("unitKey"));

    if (!unitKey) {
      return NextResponse.json({ error: "Missing or invalid unitKey" }, { status: 400 });
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Fetch attempts ordered by best quality, then fastest duration.
    const { data: attempts, error } = await supabase
      .from("unit_test_attempts")
      .select("id,user_id,unit_key,quality_score,duration_ms,finished_at,started_at")
      .eq("unit_key", unitKey)
      .order("quality_score", { ascending: false })
      .order("duration_ms", { ascending: true })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const byUser = new Map<string, (typeof attempts)[number]>();
    for (const a of attempts ?? []) {
      const uid = a.user_id;
      if (!uid) continue;
      if (!byUser.has(uid)) byUser.set(uid, a);
    }

    const bestPerUser = Array.from(byUser.values());
    bestPerUser.sort((a, b) => {
      const qa = a.quality_score ?? 0;
      const qb = b.quality_score ?? 0;
      if (qa !== qb) return qb - qa;
      const da = a.duration_ms ?? Number.MAX_SAFE_INTEGER;
      const db = b.duration_ms ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

    const top3 = bestPerUser.slice(0, 3);
    const userIds = top3.map((t) => t.user_id).filter(Boolean) as string[];

    const { data: users } = await supabase
      .from("users")
      .select("id,name,email")
      .in("id", userIds);

    const userById = new Map((users ?? []).map((u) => [u.id, u]));

    const leaderboard = top3.map((t, idx) => {
      const u = userById.get(t.user_id as string);
      const emailLocal =
        typeof (u as { email?: string } | undefined)?.email === "string"
          ? ((u as { email: string }).email.split("@")[0] ?? "").trim()
          : "";
      const displayName = (u?.name ?? "").trim() || emailLocal || "Learner";
      return {
        rank: idx + 1,
        attemptId: t.id,
        userId: t.user_id,
        userName: displayName,
        userEmail: (u as { email?: string } | undefined)?.email ?? "",
        qualityScore: Number(t.quality_score ?? 0),
        durationMs: Number(t.duration_ms ?? 0),
        finishedAt: t.finished_at,
        startedAt: t.started_at,
      };
    });

    return NextResponse.json({ unitKey, leaderboard });
  } catch (e) {
    const err = e as any;
    const message =
      err?.message ||
      err?.error?.message ||
      err?.error_description ||
      (typeof err === "string" ? err : undefined) ||
      JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
    console.error("unit-tests/leaderboard error:", err);
    return NextResponse.json({ error: message ?? "Internal server error" }, { status: 500 });
  }
}

