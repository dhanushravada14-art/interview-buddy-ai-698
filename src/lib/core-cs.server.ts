import { generateText, NoObjectGeneratedError, Output } from "ai";
import { z } from "zod";
import { getGatewayModel } from "./ai-gateway.server";
import type { CoreCsSubjectMeta, CoreCsTopic } from "./core-cs";

const quizSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correct_index: z.number(),
      explanation: z.string(),
    }),
  ),
});

export type CoreCsQuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
};

export async function generateTopicQuiz(subject: CoreCsSubjectMeta, topic: CoreCsTopic) {
  const model = getGatewayModel();
  try {
    const { output } = await generateText({
      model,
      system:
        "You are a computer science professor writing a fresher-level campus placement quiz. Questions must be precise, unambiguous and test real understanding, not trivia.",
      prompt: `Subject: ${subject.name}
Topic: ${topic.name} — ${topic.summary}

Write exactly 10 multiple choice questions on this topic, suitable for a college placement interview. Each question needs exactly 4 options, one correct_index (0-3), and a short explanation of why that answer is correct. Vary difficulty from easy to moderately hard. Do not repeat the same sub-concept more than twice.`,
      output: Output.object({ schema: quizSchema }),
    });
    const questions: CoreCsQuizQuestion[] = output.questions.slice(0, 10).map((q, i) => ({
      id: i,
      question: q.question,
      options: q.options.slice(0, 4),
      correct_index: q.correct_index,
      explanation: q.explanation,
    }));
    if (!questions.length) throw new Error("No questions generated");
    return questions;
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      throw new Error("Could not generate a quiz right now. Please try again.");
    }
    throw error;
  }
}

const questionsSchema = z.object({
  questions: z.array(z.string()),
});

export async function generateInterviewQuestions(subject: CoreCsSubjectMeta, topic: CoreCsTopic) {
  const model = getGatewayModel();
  const { output } = await generateText({
    model,
    system: "You are curating the most commonly asked campus interview questions on a CS topic.",
    prompt: `Subject: ${subject.name}
Topic: ${topic.name} — ${topic.summary}

List 8 interview questions that are genuinely and commonly asked on this exact topic in campus/off-campus technical interviews, ordered from foundational to advanced.`,
    output: Output.object({ schema: questionsSchema }),
  });
  return output.questions.slice(0, 8);
}

export async function generateModelAnswer(
  subject: CoreCsSubjectMeta,
  topic: CoreCsTopic,
  question: string,
) {
  const model = getGatewayModel();
  const { text } = await generateText({
    model,
    system:
      "You are an expert interviewer giving a model answer a strong fresher candidate should be able to give. Answer in clean markdown with short paragraphs, bullet points, and a small example where useful.",
    prompt: `Subject: ${subject.name}
Topic: ${topic.name}
Interview question: ${question}

Write a model answer (150-250 words) that would impress an interviewer, including any relevant example, diagram-in-words or trade-off discussion.`,
  });
  return text;
}
