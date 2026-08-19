import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProfileInput = z.object({
  full_name: z.string().max(120).default(""),
  college: z.string().max(160).default(""),
  degree: z.string().max(120).default(""),
  graduation_year: z.string().max(10).default(""),
  target_role: z.string().max(120).default(""),
  skills: z.array(z.string().max(60)).max(40).default([]),
  projects: z.string().max(4000).default(""),
});

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("interview_sessions")
      .select("id, round, round_name, score, completed, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Interview not found");
    return row;
  });

export const startRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().max(30) }).parse(input))
  .handler(async ({ data, context }) => {
    const { buildRound } = await import("./interview.server");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();

    const { meta, questions } = await buildRound(data.slug, profile);

    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .insert({
        user_id: context.userId,
        round: meta.round,
        round_name: meta.name,
        questions,
      })
      .select("id, round, round_name, questions")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const submitRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), answers: z.array(z.string().max(6000)) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { gradeRound } = await import("./interview.server");
    const { data: row, error } = await context.supabase
      .from("interview_sessions")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Interview not found");

    const { data: profile } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();

    const result = await gradeRound(row, data.answers, profile);

    const { error: upErr } = await context.supabase
      .from("interview_sessions")
      .update({
        answers: data.answers,
        per_question: result.per_question,
        score: result.score,
        feedback: result.feedback,
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("user_id", context.userId);
    if (upErr) throw new Error(upErr.message);

    return result;
  });
