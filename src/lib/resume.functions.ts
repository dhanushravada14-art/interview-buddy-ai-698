import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ResumeInput = z.object({
  filename: z.string().max(200).default(""),
  text: z.string().min(80, "That looks too short to be a resume.").max(30000),
});

export const ParsedResume = z.object({
  full_name: z.string().default(""),
  college: z.string().default(""),
  branch: z.string().default(""),
  degree: z.string().default(""),
  graduation_year: z.string().default(""),
  cgpa: z.string().default(""),
  target_role: z.string().default(""),
  skills: z.array(z.string()).default([]),
  projects: z.string().default(""),
  internships: z.string().default(""),
  certifications: z.string().default(""),
  achievements: z.string().default(""),
  summary: z.string().default(""),
  suggestions: z.array(z.string()).default([]),
});
export type ParsedResumeData = z.infer<typeof ParsedResume>;

/** Parse resume text with AI, store it on the profile and return the fields
 *  so the student can review them before they overwrite their profile. */
export const parseResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ResumeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { generateObject } = await import("ai");
    const { getGatewayModel } = await import("./ai-gateway.server");

    const { object } = await generateObject({
      model: getGatewayModel(),
      schema: ParsedResume,
      prompt: `You are an expert placement mentor reading a B.Tech student's resume.
Extract the fields accurately. For projects, internships, certifications and achievements write
short readable paragraphs or bullet lines (plain text, no markdown headings).
Infer target_role from the resume's objective/skills if not stated.
"summary" = 2-3 sentence assessment of placement readiness.
"suggestions" = 3-5 concrete resume improvements.
Leave a field as an empty string if the resume truly does not mention it.

RESUME:
${data.text}`,
    });

    const { error } = await context.supabase
      .from("profiles")
      .upsert({
        id: context.userId,
        resume_text: data.text.slice(0, 30000),
        resume_filename: data.filename,
        resume_parsed: object as never,
      });
    if (error) throw new Error(error.message);

    return object;
  });
