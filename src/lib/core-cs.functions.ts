import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { subjectBySlug, topicBySlug } from "./core-cs";
import { logActivity } from "./activities.functions";

const TopicInput = z.object({
  subject: z.string().max(20),
  topic: z.string().max(60),
});

export const generateQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TopicInput.parse(input))
  .handler(async ({ data }) => {
    const { subject, topic } = topicBySlug(data.subject, data.topic);
    if (!subject || !topic) throw new Error("Unknown topic");
    const { generateTopicQuiz } = await import("./core-cs.server");
    return generateTopicQuiz(subject, topic);
  });

export const generateQuestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TopicInput.parse(input))
  .handler(async ({ data }) => {
    const { subject, topic } = topicBySlug(data.subject, data.topic);
    if (!subject || !topic) throw new Error("Unknown topic");
    const { generateInterviewQuestions } = await import("./core-cs.server");
    return generateInterviewQuestions(subject, topic);
  });

export const generateAnswer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    TopicInput.extend({ question: z.string().max(500) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { subject, topic } = topicBySlug(data.subject, data.topic);
    if (!subject || !topic) throw new Error("Unknown topic");
    const { generateModelAnswer } = await import("./core-cs.server");
    const answer = await generateModelAnswer(subject, topic, data.question);
    return { answer };
  });

const SubmitQuizInput = z.object({
  subject: z.string().max(20),
  topic: z.string().max(60),
  answers: z.array(z.number()).max(10),
  correct: z.array(z.number()).max(10),
});

export const submitQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SubmitQuizInput.parse(input))
  .handler(async ({ data }) => {
    const subjectMeta = subjectBySlug(data.subject);
    if (!subjectMeta) throw new Error("Unknown subject");
    const { topic } = topicBySlug(data.subject, data.topic);
    const total = data.correct.length || 1;
    const right = data.answers.filter((a, i) => a === data.correct[i]).length;
    const score = Math.round((right / total) * 100);

    await logActivity({
      data: {
        kind: "quiz",
        topic: subjectMeta.areaTopic,
        subtopic: topic?.name ?? data.topic,
        title: `${subjectMeta.name}: ${topic?.name ?? data.topic} quiz`,
        score,
        details: { right, total, answers: data.answers, correct: data.correct },
      },
    });
    return { score, right, total };
  });
