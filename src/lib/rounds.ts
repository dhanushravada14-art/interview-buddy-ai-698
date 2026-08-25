export type RoundKey = 1 | 2 | 3 | 4;

export type RoundMeta = {
  round: RoundKey;
  slug: string;
  name: string;
  tagline: string;
  format: "mcq" | "text";
  count: number;
  minutes: number;
};

export const ROUNDS: RoundMeta[] = [
  {
    round: 1,
    slug: "aptitude",
    name: "Round 1 — Aptitude Test",
    tagline:
      "20 timed questions: 5 easy, 10 moderate, 5 tough across quantitative, logical reasoning and verbal ability.",
    format: "mcq",
    count: 20,
    minutes: 30,
  },
  {
    round: 2,
    slug: "managerial",
    name: "Round 2 — Managerial Round",
    tagline: "Situational judgement, ownership, teamwork and decision making.",
    format: "text",
    count: 5,
    minutes: 20,
  },
  {
    round: 3,
    slug: "technical",
    name: "Round 3 — Technical Round",
    tagline: "Deep questions generated from your own skills and projects.",
    format: "text",
    count: 6,
    minutes: 30,
  },
  {
    round: 4,
    slug: "hr",
    name: "Round 4 — HR Round",
    tagline: "Motivation, culture fit, strengths, weaknesses and expectations.",
    format: "text",
    count: 5,
    minutes: 15,
  },
];

export function roundBySlug(slug: string): RoundMeta | undefined {
  return ROUNDS.find((r) => r.slug === slug);
}

export function scoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Needs work";
  return "Weak";
}
