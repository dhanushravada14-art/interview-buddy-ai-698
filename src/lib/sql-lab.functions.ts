import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ExplainInput = z.object({
  mode: z.enum(["query", "concept"]),
  question: z.string().min(1).max(2000),
  userInput: z.string().min(1).max(4000),
  schemaSql: z.string().max(4000).optional(),
});

export const explainSql = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ExplainInput.parse(input))
  .handler(async ({ data }) => {
    const { getGatewayModel } = await import("@/lib/ai-gateway.server");
    const { generateText } = await import("ai");

    const prompt =
      data.mode === "query"
        ? `You are a SQL tutor. The user is solving this practice question:\n\n${data.question}\n\nSchema:\n${data.schemaSql ?? ""}\n\nTheir SQL query:\n\`\`\`sql\n${data.userInput}\n\`\`\`\n\nExplain in plain English what this query does step by step, point out any mistakes or inefficiencies relative to the question, and suggest how to fix or improve it if needed. Keep it under 200 words, markdown formatted.`
        : `You are a SQL/DBMS tutor grading a concept explanation.\n\nQuestion: ${data.question}\n\nStudent's answer:\n${data.userInput}\n\nGive concise feedback: what's correct, what's missing or wrong, and a clear correct explanation. Keep it under 220 words, markdown formatted.`;

    const { text } = await generateText({ model: getGatewayModel(), prompt });
    return { explanation: text };
  });
