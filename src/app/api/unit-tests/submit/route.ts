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

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = await req.json();
    const unitKey = parseUnitKey(body?.unitKey);
    const userId = typeof body?.userId === "string" ? body.userId : null;
    const qualityScore = Number(body?.qualityScore);
    const durationMs = Number(body?.durationMs);

    if (!unitKey || !userId) {
      return NextResponse.json({ error: "Missing or invalid unitKey/userId" }, { status: 400 });
    }
    if (!Number.isFinite(qualityScore) || qualityScore < 0 || qualityScore > 100) {
      return NextResponse.json({ error: "Invalid qualityScore" }, { status: 400 });
    }
    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return NextResponse.json({ error: "Invalid durationMs" }, { status: 400 });
    }

    const finishedAt = new Date();
    const startedAt = new Date(Date.now() - Math.floor(durationMs));

    const { data: attempt, error: attemptError } = await supabase
      .from("unit_test_attempts")
      .insert({
        user_id: userId,
        unit_key: unitKey,
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        duration_ms: Math.floor(durationMs),
        quality_score: Math.round(qualityScore),
      })
      .select("id")
      .single();

    if (attemptError || !attempt?.id) {
      return NextResponse.json(
        { error: attemptError?.message || "Could not save attempt" },
        { status: 500 }
      );
    }

    // Recompute top-3 unique users for this unit and award premium.
    const { data: allAttempts, error: leaderboardError } = await supabase
      .from("unit_test_attempts")
      .select("id,user_id,unit_key,quality_score,duration_ms,finished_at")
      .eq("unit_key", unitKey)
      .order("quality_score", { ascending: false })
      .order("duration_ms", { ascending: true })
      .limit(500);

    if (leaderboardError) {
      return NextResponse.json({ error: leaderboardError.message }, { status: 500 });
    }

    const byUser = new Map<string, (typeof allAttempts)[number]>();
    for (const a of allAttempts ?? []) {
      const uid = a.user_id;
      if (!uid) continue;
      if (!byUser.has(uid)) byUser.set(uid, a);
    }

    const bestPerUser = Array.from(byUser.values());
    bestPerUser.sort((a, b) => {
      const qa = Number(a.quality_score ?? 0);
      const qb = Number(b.quality_score ?? 0);
      if (qa !== qb) return qb - qa;
      return Number(a.duration_ms ?? Number.MAX_SAFE_INTEGER) - Number(b.duration_ms ?? Number.MAX_SAFE_INTEGER);
    });

    const top3 = bestPerUser.slice(0, 3);
    const now = new Date();
    const expiresInDays: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

    const winnerIds = top3.map((t) => t.user_id).filter(Boolean) as string[];
    const { data: existingRewards } = await supabase
      .from("premium_rewards")
      .select("user_id,unit_key,rank,expires_at")
      .eq("unit_key", unitKey)
      .in("user_id", winnerIds);

    const existingByKey = new Map<string, string>();
    for (const r of existingRewards ?? []) {
      existingByKey.set(`${r.user_id}:${r.rank}`, r.expires_at);
    }

    const rewardRows = top3.map((t, idx) => {
      const rank = idx + 1;
      const days = expiresInDays[rank] ?? 0;
      const newExpires = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const existingExpiresAt = existingByKey.get(`${t.user_id}:${rank}`);
      const finalExpiresAt = existingExpiresAt
        ? new Date(existingExpiresAt).getTime() > newExpires.getTime()
          ? existingExpiresAt
          : newExpires.toISOString()
        : newExpires.toISOString();

      return {
        user_id: t.user_id,
        unit_key: unitKey,
        rank,
        granted_at: now.toISOString(),
        expires_at: finalExpiresAt,
        attempt_id: t.id,
        quality_score: Number(t.quality_score ?? 0),
        duration_ms: Number(t.duration_ms ?? 0),
      };
    });

    const { error: upsertError } = await supabase
      .from("premium_rewards")
      .upsert(rewardRows, { onConflict: "user_id,unit_key,rank" });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const yourRank = top3.findIndex((t) => t.user_id === userId) + 1; // 1..3 or 0
    const you = rewardRows.find((r) => r.user_id === userId && r.rank === yourRank) ?? null;

    const leaderboard = top3.map((t, idx) => ({
      rank: idx + 1,
      userId: t.user_id,
      attemptId: t.id,
      qualityScore: Number(t.quality_score ?? 0),
      durationMs: Number(t.duration_ms ?? 0),
      finishedAt: t.finished_at,
    }));

    return NextResponse.json({
      ok: true,
      yourRank: yourRank > 0 ? yourRank : null,
      premiumExpiresAt: you?.expires_at ?? null,
      leaderboard,
      attemptId: attempt.id,
    });
  } catch (e) {
    const err = e as any;
    const message =
      err?.message ||
      err?.error?.message ||
      err?.error_description ||
      (typeof err === "string" ? err : undefined) ||
      JSON.stringify(err, Object.getOwnPropertyNames(err ?? {}));
    console.error("unit-tests/submit error:", err);
    return NextResponse.json({ error: message ?? "Internal server error" }, { status: 500 });
  }
}

