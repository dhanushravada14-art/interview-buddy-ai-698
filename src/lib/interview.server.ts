import { generateText, Output, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { getGatewayModel } from "./ai-gateway.server";
import { ROUNDS, roundBySlug, type RoundMeta } from "./rounds";

export type Question = {
  id: number;
  type: "mcq" | "text";
  topic: string;
  question: string;
  options?: string[];
  correct_index?: number;
  explanation?: string;
};

type ProfileRow = {
  full_name?: string | null;
  college?: string | null;
  degree?: string | null;
  graduation_year?: string | null;
  target_role?: string | null;
  skills?: string[] | null;
  projects?: string | null;
} | null;

function profileBrief(profile: ProfileRow) {
  if (!profile) return "No profile details provided. Assume a generic final-year student.";
  return [
    `Name: ${profile.full_name || "Student"}`,
    `Degree: ${profile.degree || "not specified"} at ${profile.college || "not specified"}`,
    `Graduating: ${profile.graduation_year || "not specified"}`,
    `Target role: ${profile.target_role || "Software Engineer (fresher)"}`,
    `Skills: ${(profile.skills ?? []).join(", ") || "not specified"}`,
    `Projects: ${profile.projects || "not specified"}`,
  ].join("\n");
}

const roundBrief: Record<number, string> = {
  1: `Round 1 is a written APTITUDE test of exactly 20 questions, using the real question patterns companies actually ask in campus placement aptitude papers (TCS, Infosys, Wipro, Capgemini, Accenture style).
Difficulty mix is mandatory:
- Questions 1-5: EASY (direct one-step formula or vocabulary/grammar).
- Questions 6-15: MODERATE (two-step reasoning, standard placement favourites).
- Questions 16-20: TOUGH (multi-step, tricky data interpretation, advanced puzzles).
Prefix each topic with the difficulty, e.g. "Easy · Percentages", "Moderate · Time & Work", "Tough · Puzzles".
Cover quantitative aptitude, logical reasoning, data interpretation and verbal ability, and lightly bias a couple of questions toward the student's target role domain.`,
  2: "Round 2 is a MANAGERIAL interview. Mostly ask the questions managers genuinely ask in placement interviews (handling conflict with a teammate, missing a deadline, prioritising two urgent tasks, leading without authority, taking ownership of a mistake), and ground them in the student's actual projects.",
  3: "Round 3 is a TECHNICAL interview. Blend the standard technical interview staples for freshers (core fundamentals of their languages, OOP, DBMS/SQL, OS, networks, complexity) with deep probes on their listed skills and projects: design decisions, trade-offs and debugging of what they actually built.",
  4: "Round 4 is an HR interview. Ask the classic HR questions asked in nearly every interview (tell me about yourself, why this company/role, strengths and weaknesses, where do you see yourself in 5 years, relocation and shifts, salary expectations, why should we hire you), personalised to their background.",
};

const mcqSchema = z.object({
  questions: z.array(
    z.object({
      topic: z.string(),
      question: z.string(),
      options: z.array(z.string()),
      correct_index: z.number(),
      explanation: z.string(),
    }),
  ),
});

const textSchema = z.object({
  questions: z.array(z.object({ topic: z.string(), question: z.string() })),
});

export async function buildRound(slug: string, profile: ProfileRow) {
  const meta = roundBySlug(slug) ?? ROUNDS[0]!;
  const model = getGatewayModel();
  const system =
    "You are an experienced campus placement interviewer at a top product company. You interview first-time candidates fairly but realistically. Never repeat generic templated questions; personalise everything.";
  const prompt = `${roundBrief[meta.round]}

Candidate profile:
${profileBrief(profile)}

Generate exactly ${meta.count} questions.${
    meta.format === "mcq"
      ? " Each question must have exactly 4 options and one correct answer index (0-3), plus a one-line explanation."
      : " Questions must be open-ended and answerable in a short paragraph."
  }`;

  try {
    const { output } = await generateText({
      model,
      system,
      prompt,
      output: Output.object({ schema: meta.format === "mcq" ? mcqSchema : textSchema }),
    });

    const raw = (output as { questions: unknown[] }).questions.slice(0, meta.count);
    const questions: Question[] = raw.map((q, i) => {
      const item = q as Record<string, unknown>;
      return {
        id: i,
        type: meta.format,
        topic: String(item["topic"] ?? "General"),
        question: String(item["question"] ?? ""),
        ...(meta.format === "mcq"
          ? {
              options: (item["options"] as string[] | undefined)?.slice(0, 4) ?? [],
              correct_index: Number(item["correct_index"] ?? 0),
              explanation: String(item["explanation"] ?? ""),
            }
          : {}),
      };
    });

    if (questions.length === 0)
      throw new Error("The interviewer could not generate questions. Please try again.");
    return { meta: meta as RoundMeta, questions };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("The interviewer could not generate questions. Please try again.");
    }
    throw error;
  }
}

const gradeSchema = z.object({
  per_question: z.array(
    z.object({
      marks: z.number(),
      verdict: z.string(),
      ideal_answer: z.string(),
      concept: z.string(),
    }),
  ),
  feedback: z.string(),
});

const conceptSchema = z.object({
  explanations: z.array(z.object({ concept: z.string() })),
});

export type PerQuestion = {
  marks: number;
  verdict: string;
  ideal_answer: string;
  concept: string;
};

export type GradeResult = {
  score: number;
  per_question: PerQuestion[];
  feedback: string;
};

// Detailed teaching notes for the aptitude round: the concept behind each
// question, the method step by step, and the traps students fall into.
async function explainMcqConcepts(
  questions: Question[],
  answers: string[],
): Promise<string[]> {
  const model = getGatewayModel();
  const list = questions
    .map((q, i) => {
      const opts = (q.options ?? []).map((o, j) => `${j}. ${o}`).join(" | ");
      return `Q${i + 1} (${q.topic}): ${q.question}\nOptions: ${opts}\nCorrect option index: ${q.correct_index ?? 0}\nStudent picked index: ${answers[i] ?? "(none)"}`;
    })
    .join("\n\n");

  try {
    const { output } = await generateText({
      model,
      system:
        "You are a patient placement-training tutor. You teach the underlying concept clearly to a first-time candidate.",
      prompt: `For each aptitude question below, write a detailed markdown explanation (about 120-180 words) with these parts:
**Concept** - the topic/rule being tested and why it applies here.
**Formula / rule** - any formula or logical rule, written out.
**Step by step** - the full worked solution leading to the correct option.
**Why the other options are wrong** - short reasons.
**Common mistake** - the trap students hit, and a tip to avoid it next time.

Questions:
${list}`,
      output: Output.object({ schema: conceptSchema }),
    });
    const parsed = output as z.infer<typeof conceptSchema>;
    return questions.map((_, i) => parsed.explanations[i]?.concept ?? "");
  } catch {
    return questions.map(() => "");
  }
}

export async function gradeRound(
  row: { round: number; round_name: string; questions: unknown },
  answers: string[],
  profile: ProfileRow,
): Promise<GradeResult> {
  const questions = (row.questions as Question[]) ?? [];
  const model = getGatewayModel();

  if (questions[0]?.type === "mcq") {
    const concepts = await explainMcqConcepts(questions, answers);
    const per_question = questions.map((q, i) => {
      const picked = answers[i] ?? "";
      const correct = String(q.correct_index ?? 0);
      const isRight = picked === correct;
      return {
        marks: isRight ? 10 : 0,
        verdict: isRight
          ? "Correct"
          : `Incorrect — correct option: ${q.options?.[q.correct_index ?? 0] ?? "-"}`,
        ideal_answer: q.explanation ?? "",
        concept: concepts[i] || q.explanation || "",
      };
    });
    const correctCount = per_question.filter((p) => p.marks > 0).length;
    const score = Math.round((correctCount / Math.max(questions.length, 1)) * 100);
    const weak = questions
      .filter((_, i) => per_question[i]!.marks === 0)
      .map((q) => q.topic)
      .filter((t, i, a) => a.indexOf(t) === i);

    let feedback = `You answered ${correctCount} of ${questions.length} correctly (${score}/100).`;
    feedback += weak.length
      ? ` Focus your practice on: ${weak.join(", ")}.`
      : " Excellent accuracy — keep the same pace under timed conditions.";
    return { score, per_question, feedback };
  }

  const transcript = questions
    .map(
      (q, i) =>
        `Q${i + 1} (${q.topic}): ${q.question}\nCandidate answer: ${answers[i]?.trim() || "(no answer)"}`,
    )
    .join("\n\n");

  const prompt = `You are grading ${row.round_name} for a first-time campus candidate.

Candidate profile:
${profileBrief(profile)}

Transcript:
${transcript}

For each question return: marks out of 10; a one or two sentence verdict naming what was strong or missing; a short ideal answer; and a detailed markdown "concept" explanation of about 130-200 words that teaches the underlying idea being tested, structured as **What this question tests**, **The concept explained**, **How to structure a strong answer** (a framework such as STAR, or the technical fundamentals involved), and **Common mistake to avoid**. Then write overall feedback in markdown with three short sections: What went well, What to improve, and Next steps. Be encouraging but honest. An empty answer scores 0.`;

  try {
    const { output } = await generateText({
      model,
      system:
        "You are a strict but supportive interview evaluator. Return calibrated marks — do not give everyone high scores.",
      prompt,
      output: Output.object({ schema: gradeSchema }),
    });

    const parsed = output as z.infer<typeof gradeSchema>;
    const per_question = questions.map((_, i) => {
      const p = parsed.per_question[i];
      return {
        marks: Math.max(0, Math.min(10, Math.round(p?.marks ?? 0))),
        verdict: p?.verdict ?? "Not evaluated.",
        ideal_answer: p?.ideal_answer ?? "",
        concept: p?.concept ?? "",
      };
    });
    const total = per_question.reduce((s, p) => s + p.marks, 0);
    const score = Math.round((total / Math.max(questions.length * 10, 1)) * 100);
    return { score, per_question, feedback: parsed.feedback };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("Grading failed. Please submit again.");
    }
    throw error;
  }
}
