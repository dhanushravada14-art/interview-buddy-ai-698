import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { problemBySlug } from "@/lib/dsa-problems";

const LANGUAGE_CONFIG = {
  c: { language: "c", version: "10.2.0" },
  cpp: { language: "cpp", version: "10.2.0" },
  java: { language: "java", version: "15.0.2" },
  python: { language: "python", version: "3.10.0" },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_CONFIG;

const RunInput = z.object({
  slug: z.string().min(1),
  language: z.enum(["c", "cpp", "java", "python"]),
  code: z.string().min(1).max(20000),
});

type PistonResult = {
  run?: { stdout?: string; stderr?: string; code?: number; signal?: string | null };
  compile?: { stdout?: string; stderr?: string; code?: number };
};

async function runOnPiston(
  language: SupportedLanguage,
  code: string,
  stdin: string,
): Promise<{ stdout: string; stderr: string; ok: boolean }> {
  const cfg = LANGUAGE_CONFIG[language];
  const fileExt = { c: "c", cpp: "cpp", java: "java", python: "py" }[language];
  const filename = language === "java" ? "Main.java" : `main.${fileExt}`;
  const res = await fetch("https://emkc.org/api/v2/piston/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: cfg.language,
      version: cfg.version,
      files: [{ name: filename, content: code }],
      stdin,
    }),
  });
  if (!res.ok) {
    throw new Error(`Piston execution failed (${res.status})`);
  }
  const data = (await res.json()) as PistonResult;
  const compileErr = data.compile?.code && data.compile.code !== 0 ? data.compile.stderr ?? "" : "";
  const stdout = data.run?.stdout ?? "";
  const stderr = compileErr || data.run?.stderr || "";
  const ok = !compileErr && (data.run?.code ?? 1) === 0;
  return { stdout, stderr, ok };
}

export type TestResult = {
  passed: boolean;
  stdin: string;
  expected: string;
  actual: string;
  stderr: string;
};

export const runCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data }) => {
    const problem = problemBySlug(data.slug);
    if (!problem) throw new Error("Problem not found");

    const results: TestResult[] = [];
    // Only run the first two visible sample tests for a quick "Run" check.
    const sample = problem.tests.slice(0, 2);
    for (const t of sample) {
      const { stdout, stderr, ok } = await runOnPiston(data.language, data.code, t.stdin);
      const actual = stdout.trim();
      const expected = t.expected.trim();
      results.push({ passed: ok && actual === expected, stdin: t.stdin, expected, actual, stderr });
    }
    return { results };
  });

export const submitCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data, context }) => {
    const problem = problemBySlug(data.slug);
    if (!problem) throw new Error("Problem not found");

    const results: TestResult[] = [];
    for (const t of problem.tests) {
      const { stdout, stderr, ok } = await runOnPiston(data.language, data.code, t.stdin);
      const actual = stdout.trim();
      const expected = t.expected.trim();
      results.push({ passed: ok && actual === expected, stdin: t.stdin, expected, actual, stderr });
    }
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;
    const status = passed === total ? "accepted" : passed > 0 ? "partial" : "failed";

    let review: string | null = null;
    try {
      const { getGatewayModel } = await import("@/lib/ai-gateway.server");
      const { generateText } = await import("ai");
      const { text } = await generateText({
        model: getGatewayModel(),
        prompt: `You are a senior interviewer reviewing a candidate's coding submission.

Problem: ${problem.title} (${problem.topic}, ${problem.difficulty})
Statement: ${problem.statement}

Language: ${data.language}
Code:
\`\`\`${data.language}
${data.code}
\`\`\`

Test results: ${passed}/${total} passed.

Write a concise markdown review covering: 1) Correctness (does it solve the problem, any edge cases missed), 2) Time and space complexity, 3) Mistakes/bugs if any, 4) Concrete improvements. Keep it under 250 words.`,
      });
      review = text;
    } catch (e) {
      review = `_AI review unavailable: ${e instanceof Error ? e.message : "unknown error"}_`;
    }

    const { error } = await context.supabase.from("coding_submissions").insert({
      user_id: context.userId,
      problem_slug: problem.slug,
      topic: problem.topic,
      language: data.language,
      code: data.code,
      passed,
      total,
      status,
      review: { text: review } as never,
    });
    if (error) throw new Error(error.message);

    return { results, passed, total, status, review };
  });

const SubmissionsInput = z.object({}).optional();

export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmissionsInput.parse(input))
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("coding_submissions")
      .select("id, problem_slug, topic, language, passed, total, status, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const SubmissionsForSlugInput = z.object({ slug: z.string().min(1) });

export const getSubmissionsForSlug = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmissionsForSlugInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("coding_submissions")
      .select("id, language, passed, total, status, review, created_at")
      .eq("user_id", context.userId)
      .eq("problem_slug", data.slug)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });
