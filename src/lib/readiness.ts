// Pure helpers shared by dashboard, roadmap, progress and coach.
// Works on rows from the `activities` table.

export const AREAS = [
  "Aptitude",
  "DSA",
  "SQL",
  "DBMS",
  "OS",
  "CN",
  "OOP",
  "Technical",
  "Managerial",
  "HR",
  "Projects",
] as const;
export type Area = (typeof AREAS)[number];

// Weight of each area inside the 0-100 readiness score (sums to 100).
export const AREA_WEIGHTS: Record<Area, number> = {
  Aptitude: 14,
  DSA: 18,
  SQL: 8,
  DBMS: 5,
  OS: 4,
  CN: 3,
  OOP: 5,
  Technical: 14,
  Managerial: 6,
  HR: 10,
  Projects: 13,
};

export const AREA_ROUTES: Record<Area, string> = {
  Aptitude: "/interview/aptitude",
  DSA: "/dsa",
  SQL: "/sql",
  DBMS: "/core-cs/dbms",
  OS: "/core-cs/os",
  CN: "/core-cs/cn",
  OOP: "/core-cs/oop",
  Technical: "/interview/technical",
  Managerial: "/interview/managerial",
  HR: "/interview/hr",
  Projects: "/projects",
};

export type ActivityRow = {
  id?: string;
  kind: string;
  topic: string;
  subtopic?: string | null;
  title?: string | null;
  score: number;
  details?: unknown;
  created_at: string;
};

export type AreaStat = { area: Area; score: number | null; attempts: number; last: string | null };

function normaliseArea(topic: string): Area | null {
  const t = topic.trim().toLowerCase();
  const hit = AREAS.find((a) => a.toLowerCase() === t);
  if (hit) return hit;
  if (t.includes("apt")) return "Aptitude";
  if (t.includes("dsa") || t.includes("coding") || t.includes("algorithm")) return "DSA";
  if (t.includes("sql")) return "SQL";
  if (t.includes("dbms") || t.includes("database")) return "DBMS";
  if (t.includes("operating")) return "OS";
  if (t.includes("network")) return "CN";
  if (t.includes("oop") || t.includes("object")) return "OOP";
  if (t.includes("project")) return "Projects";
  if (t.includes("manag")) return "Managerial";
  if (t.includes("hr")) return "HR";
  if (t.includes("tech")) return "Technical";
  return null;
}

// Recency-weighted average of the latest attempts (newest weighs most).
function recencyAverage(scores: number[]) {
  if (!scores.length) return null;
  let sum = 0;
  let weight = 0;
  scores.slice(0, 6).forEach((s, i) => {
    const w = 0.75 ** i;
    sum += s * w;
    weight += w;
  });
  return Math.round(sum / weight);
}

export function areaStats(activities: ActivityRow[]): AreaStat[] {
  const sorted = [...activities].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return AREAS.map((area) => {
    const rows = sorted.filter((r) => normaliseArea(r.topic) === area);
    return {
      area,
      score: recencyAverage(rows.map((r) => r.score)),
      attempts: rows.length,
      last: rows[0]?.created_at ?? null,
    };
  });
}

export function computeReadiness(activities: ActivityRow[]) {
  const stats = areaStats(activities);
  const total = stats.reduce((s, a) => s + ((a.score ?? 0) * AREA_WEIGHTS[a.area]) / 100, 0);
  return Math.round(total);
}

export type WeakTopic = {
  area: Area;
  subtopic: string;
  avg: number;
  attempts: number;
  repeated: boolean;
  last: string;
};

// Sub-topic level weaknesses: uses the activity's own subtopic plus per-question
// topics stored in details.questions [{topic, marks}] for interview rounds.
export function weakTopics(activities: ActivityRow[], threshold = 60): WeakTopic[] {
  const buckets = new Map<string, { area: Area; subtopic: string; scores: number[]; last: string }>();
  const push = (area: Area, subtopic: string, score: number, when: string) => {
    const key = `${area}::${subtopic}`;
    const b = buckets.get(key) ?? { area, subtopic, scores: [], last: when };
    b.scores.push(score);
    if (when > b.last) b.last = when;
    buckets.set(key, b);
  };

  for (const row of activities) {
    const area = normaliseArea(row.topic);
    if (!area) continue;
    const details = (row.details ?? {}) as { questions?: { topic?: string; marks?: unknown }[] };
    const qs = Array.isArray(details.questions) ? details.questions : [];
    if (qs.length && row.kind === "interview") {
      const perQ = area === "Aptitude" ? 10 : 10;
      for (const q of qs) {
        const marks = Number(q.marks ?? 0);
        const label = String(q.topic ?? "General").replace(/^(Easy|Moderate|Tough)\s*·\s*/i, "");
        push(area, label, Math.round((marks / perQ) * 100), row.created_at);
      }
    } else {
      push(area, row.subtopic?.trim() || "General", row.score, row.created_at);
    }
  }

  return [...buckets.values()]
    .map((b) => ({
      area: b.area,
      subtopic: b.subtopic,
      avg: Math.round(b.scores.reduce((s, x) => s + x, 0) / b.scores.length),
      attempts: b.scores.length,
      repeated: b.scores.filter((s) => s < threshold).length >= 2,
      last: b.last,
    }))
    .filter((t) => t.avg < threshold)
    .sort((a, b) => Number(b.repeated) - Number(a.repeated) || a.avg - b.avg);
}

export function strengths(activities: ActivityRow[], threshold = 70) {
  return areaStats(activities)
    .filter((a) => a.score !== null && a.score >= threshold)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
}

export function weaknesses(activities: ActivityRow[], threshold = 60) {
  return areaStats(activities)
    .filter((a) => a.score === null || a.score < threshold)
    .sort((a, b) => (a.score ?? -1) - (b.score ?? -1));
}

export function readinessLabel(score: number) {
  if (score >= 80) return "Placement ready";
  if (score >= 65) return "Almost there";
  if (score >= 45) return "Building up";
  return "Getting started";
}
