import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const ActivityInput = z.object({
  kind: z.enum(["coding", "sql", "quiz", "project", "interview", "mock", "practice"]),
  topic: z.string().max(60),
  subtopic: z.string().max(80).default(""),
  title: z.string().max(200).default(""),
  score: z.number().int().min(0).max(100),
  details: z.record(z.unknown()).default({}),
  ref_id: z.string().uuid().optional(),
});

/** Record one practice attempt. Every feature calls this so weak-topic
 *  tracking and the readiness score update after each activity. */
export const logActivity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ActivityInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("activities")
      .insert({ user_id: context.userId, ...data, details: data.details as never });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { withRetry } = await import("./retry");
    return withRetry(async () => {
      const { data, error } = await context.supabase
        .from("activities")
        .select("id, kind, topic, subtopic, title, score, details, ref_id, created_at")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw new Error(error.message);
      return data ?? [];
    });
  });
