import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const StarterPrompts = [
  "What should I study today?",
  "Why am I weak in DSA?",
  "Prepare me for a backend developer interview",
  "Give me SQL questions at my level",
];

export function coachStarterPrompts() {
  return StarterPrompts;
}

export const sendCoachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        message: z.string().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { getGatewayModel } = await import("./ai-gateway.server");
    const { profileBrief } = await import("./interview.server");
    const { areaStats, computeReadiness, weakTopics, strengths, type ActivityRow } = await import(
      "./readiness"
    );

    const { data: thread, error: threadErr } = await context.supabase
      .from("doubt_threads")
      .select("id, title")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (threadErr) throw new Error(threadErr.message);
    if (!thread) throw new Error("Chat not found");

    const [{ data: history, error: historyErr }, { data: profile }, { data: activities }] =
      await Promise.all([
        context.supabase
          .from("doubt_messages")
          .select("role, parts")
          .eq("thread_id", data.threadId)
          .eq("user_id", context.userId)
          .order("created_at", { ascending: true }),
        context.supabase.from("profiles").select("*").eq("id", context.userId).maybeSingle(),
        context.supabase
          .from("activities")
          .select("kind, topic, subtopic, title, score, details, created_at")
          .eq("user_id", context.userId)
          .order("created_at", { ascending: false })
          .limit(300),
      ]);
    if (historyErr) throw new Error(historyErr.message);

    const rows = (activities ?? []) as ActivityRow[];
    const readiness = computeReadiness(rows);
    const stats = areaStats(rows).filter((s) => s.attempts > 0);
    const weak = weakTopics(rows).slice(0, 8);
    const strong = strengths(rows).slice(0, 5);

    const skillLevels = (profile?.skill_levels ?? {}) as Record<string, string>;

    const system = `You are the PrepRounds AI Placement Coach — an expert, encouraging campus-placement mentor chatting with a student inside the app.

Student profile:
${profileBrief(profile)}
Skill levels: ${Object.entries(skillLevels).length ? Object.entries(skillLevels).map(([k, v]) => `${k}: ${v}`).join(", ") : "not specified"}

Readiness score: ${readiness}/100

Area-wise performance:
${stats.length ? stats.map((s) => `- ${s.area}: ${s.score ?? "no data"} (${s.attempts} attempts)`).join("\n") : "No practice activity yet."}

Weak topics (recurring low scores):
${weak.length ? weak.map((w) => `- ${w.area} · ${w.subtopic}: avg ${w.avg}/100 over ${w.attempts} attempts${w.repeated ? " (repeated weakness)" : ""}`).join("\n") : "None identified yet — encourage the student to practise so we can personalise better."}

Strong areas:
${strong.length ? strong.map((s) => `- ${s.area}: ${s.score}/100`).join("\n") : "None yet."}

Instructions:
- Always personalise answers using the data above; refer to specific weak topics, scores and the target role by name.
- When asked "what should I study today", propose a short, concrete plan ordered by weakest area first, referencing the exact subtopics.
- When asked "why am I weak in X", explain likely root causes based on the pattern of scores, then give a fix-it plan.
- When asked to prepare for a role (e.g. backend developer), tailor a study/interview plan around DSA, SQL, DBMS/OS/CN fundamentals, system design basics and the target role.
- When asked for practice questions (e.g. "SQL questions at my level"), generate 3-5 questions calibrated to the student's stated skill level for that topic, with a short difficulty label on each.
- Format answers in clean markdown with headings/bullets where useful. Keep tone warm, specific and motivating — never generic filler.`;

    const priorMessages = (history ?? []).map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: ((m.parts ?? []) as { type: "text"; text: string }[])
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("\n"),
    }));

    const { error: insertUserErr } = await context.supabase.from("doubt_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "user",
      parts: [{ type: "text", text: data.message }],
    });
    if (insertUserErr) throw new Error(insertUserErr.message);

    const model = getGatewayModel();
    const { text } = await generateText({
      model,
      system,
      messages: [...priorMessages, { role: "user", content: data.message }],
    });

    const { error: insertAssistantErr } = await context.supabase.from("doubt_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: "assistant",
      parts: [{ type: "text", text }],
    });
    if (insertAssistantErr) throw new Error(insertAssistantErr.message);

    const nextTitle = thread.title?.trim()
      ? thread.title
      : data.message.slice(0, 60) + (data.message.length > 60 ? "…" : "");

    const { error: updateErr } = await context.supabase
      .from("doubt_threads")
      .update({ title: nextTitle, updated_at: new Date().toISOString() })
      .eq("id", data.threadId)
      .eq("user_id", context.userId);
    if (updateErr) throw new Error(updateErr.message);

    return { reply: text, title: nextTitle };
  });
