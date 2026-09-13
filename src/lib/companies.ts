// Pure helpers: readiness of a student for a specific company, derived from
// their activities and that company's topic focus. Indicative only — not a
// guarantee of what the company will actually ask.
import { areaStats, type ActivityRow } from "./readiness";

export type CompanyRow = {
  slug: string;
  name: string;
  category: string;
  description: string;
  difficulty: string;
  rounds: unknown;
  aptitude_topics: unknown;
  coding_topics: unknown;
  technical_topics: unknown;
  hr_focus: unknown;
  tips: unknown;
};

export function asStringList(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export type CompanyReadinessBreakdown = {
  area: "Aptitude" | "DSA" | "Technical" | "HR";
  weight: number;
  score: number | null;
};

const WEIGHTS = { Aptitude: 25, DSA: 25, Technical: 30, HR: 20 } as const;

export function companyReadiness(company: CompanyRow, activities: ActivityRow[]) {
  const stats = areaStats(activities);
  const scoreOf = (area: keyof typeof WEIGHTS) => stats.find((s) => s.area === area)?.score ?? null;
  const breakdown: CompanyReadinessBreakdown[] = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).map(
    (area) => ({ area, weight: WEIGHTS[area], score: scoreOf(area) }),
  );
  const total = breakdown.reduce((sum, b) => sum + ((b.score ?? 0) * b.weight) / 100, 0);
  return { percent: Math.round(total), breakdown };
}
