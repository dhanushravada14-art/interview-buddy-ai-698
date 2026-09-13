import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RoadmapPlan = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommended: z.array(z.string()).default([]),
  plan: z
    .array(
      z.object({
        day: z.number().int().min(1),
        focus: z.string(),
        tasks: z.array(z.string()).default([]),
      }),
    )
    .default([]),
});

export const getRoadmap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const generateRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ days: z.union([z.literal(7), z.literal(14), z.literal(30)]) }).parse(input))
  .handler(async ({ data, context }) => {
    const { generateObject } = await import("ai");
    const { getGatewayModel } = await import("./ai-gateway.server");
    const { areaStats, computeReadiness, weakTopics } = await import("./readiness");

    const [{ data: profile }, { data: activities }] = await Promise.all([
      context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
      context.supabase
        .from("activities")
        .select("kind, topic, subtopic, title, score, details, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const rows = activities ?? [];
    const readiness = computeReadiness(rows);
    const stats = areaStats(rows);
    const weak = weakTopics(rows).slice(0, 12);

    const { object } = await generateObject({
      model: getGatewayModel(),
      schema: RoadmapPlan,
      prompt: `You are a B.Tech placement coach in India building a ${data.days}-day preparation plan.

STUDENT PROFILE
Branch: ${profile?.branch || profile?.degree || "unknown"}
Graduation: ${profile?.graduation_year || "unknown"}, CGPA: ${profile?.cgpa || "unknown"}
Target role: ${profile?.target_role || "software engineer"}
Target companies: ${(profile?.target_companies ?? []).join(", ") || "mass recruiters"}
Skills: ${(profile?.skills ?? []).join(", ") || "not listed"}
Projects: ${(profile?.projects || "").slice(0, 900) || "not listed"}

PERFORMANCE (recency-weighted, null = never attempted)
${stats.map((s) => `${s.area}: ${s.score ?? "not attempted"} (${s.attempts} attempts)`).join("\n")}
Overall readiness: ${readiness}/100
Repeatedly weak sub-topics: ${weak.map((w) => `${w.area}/${w.subtopic} ${w.avg}%`).join("; ") || "none yet"}

Produce exactly ${data.days} day entries numbered 1..${data.days}. Each day: a short focus title and
2-4 concrete tasks naming topics and the platform section to use (Aptitude round, DSA practice,
SQL Lab, Core CS DBMS/OS/CN/OOP, Project interview, Mock interview). Front-load the weakest areas,
mix revision with mock practice, and keep the final 2 days for full mock interviews and revision.
strengths/weaknesses/recommended are short topic phrases (max 8 words each).`,
    });

    const payload = {
      user_id: context.userId,
      days: data.days,
      readiness,
      summary: object.summary,
      strengths: object.strengths as never,
      weaknesses: object.weaknesses as never,
      recommended: object.recommended as never,
      plan: object.plan as never,
      updated_at: new Date().toISOString(),
    };

    const { data: existing } = await context.supabase
      .from("roadmaps")
      .select("id")
      .eq("user_id", context.userId)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await context.supabase
        .from("roadmaps")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("roadmaps").insert(payload);
      if (error) throw new Error(error.message);
    }

    return { ...payload, stats, weak };
  });

/** Readiness + area stats + weak topics for dashboard, roadmap and coach. */
export const getReadiness = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { areaStats, computeReadiness, weakTopics } = await import("./readiness");
    const { data, error } = await context.supabase
      .from("activities")
      .select("kind, topic, subtopic, title, score, details, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    return {
      readiness: computeReadiness(rows),
      stats: areaStats(rows),
      weak: weakTopics(rows).slice(0, 15),
    };
  });
