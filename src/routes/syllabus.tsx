import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/lib/rounds";

const title = "Preparation Syllabus — PrepRounds";
const description =
  "The complete syllabus for the four placement interview rounds: aptitude, managerial, technical and HR — topics to study before you attempt each round.";

export const Route = createFileRoute("/syllabus")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SyllabusPage,
});

type Section = {
  heading: string;
  topics: string[];
};

type Syllabus = {
  intro: string;
  sections: Section[];
  tips: string[];
};

const SYLLABI: Record<number, Syllabus> = {
  // Round 1 — Aptitude
  1: {
    intro:
      "A timed multiple-choice test covering quantitative ability, logical reasoning and verbal ability. Each attempt generates fresh questions, so master the underlying patterns rather than memorising answers.",
    sections: [
      {
        heading: "Quantitative Aptitude",
        topics: [
          "Number system, HCF & LCM, divisibility rules",
          "Percentages, profit & loss, discounts, simple & compound interest",
          "Ratio, proportion, averages, alligation & mixture",
          "Time & work, pipes & cisterns, time-speed-distance",
          "Trains, boats & streams, races and clocks",
          "Permutations & combinations, basic probability",
          "Data interpretation: tables, bar charts, pie charts and line graphs",
        ],
      },
      {
        heading: "Logical Reasoning",
        topics: [
          "Sequences & series (number, letter, alpha-numeric)",
          "Analogy, classification and odd-one-out",
          "Coding-decoding and direction sense",
          "Blood relations and family trees",
          "Syllogisms, statements & assumptions, statements & conclusions",
          "Seating arrangements (linear & circular), puzzles",
          "Venn diagrams and set-based reasoning",
          "Clocks, calendars and cubes",
        ],
      },
      {
        heading: "Verbal Ability",
        topics: [
          "Reading comprehension — main idea, inference, tone",
          "Synonyms, antonyms and word usage",
          "Fill in the blanks with the right preposition / conjunction",
          "Sentence correction — grammar, tense and subject-verb agreement",
          "Spot the error and sentence improvement",
          "Para jumbles and sentence rearrangement",
          "Active/passive voice and direct/indirect speech",
        ],
      },
    ],
    tips: [
      "Aim for ~1 minute per question — skip and return to hard ones.",
      "Practice mental math: squares to 30, cubes to 15, percentage-fraction conversions.",
      "Eliminate two obviously wrong options before guessing on a hard MCQ.",
    ],
  },

  // Round 2 — Managerial
  2: {
    intro:
      "A situational judgement round with no right-or-wrong answers. You are scored on ownership, teamwork, decision-making and communication. Write how you would actually handle each scenario.",
    sections: [
      {
        heading: "Situational Judgement",
        topics: [
          "Handling a missed deadline or slipping project",
          "Conflict with a teammate or disagreement with a manager",
          "Prioritising when multiple urgent tasks collide",
          "Dealing with an underperforming peer",
          "Taking ownership of a mistake you made",
          "Resource constraints — doing more with less",
        ],
      },
      {
        heading: "Ownership & Accountability",
        topics: [
          "Defining clear ownership of outcomes, not just tasks",
          "Escalating early vs solving independently",
          "Follow-through and closing the loop",
          "Learning from failure without blame",
        ],
      },
      {
        heading: "Teamwork & Leadership",
        topics: [
          "Delegating effectively and trusting teammates",
          "Giving and receiving constructive feedback",
          "Cross-functional collaboration",
          "Influencing without authority",
        ],
      },
      {
        heading: "Decision Making",
        topics: [
          "Trade-offs between speed and quality",
          "Making decisions with incomplete information",
          "Data-driven vs intuition-driven choices",
          "Risk assessment and mitigation",
        ],
      },
      {
        heading: "Communication",
        topics: [
          "Structuring an answer: situation, action, result (STAR)",
          "Being concise and specific, not vague",
          "Active listening and clarifying questions",
          "Written clarity — grammar and tone",
        ],
      },
    ],
    tips: [
      "Use the STAR format: Situation, Task, Action, Result — for every scenario.",
      "Always say what YOU did, not what the team did — use 'I'.",
      "Acknowledge trade-offs; interviewers value honest judgement over a perfect answer.",
    ],
  },

  // Round 3 — Technical
  3: {
    intro:
      "Questions are generated from the skills and projects on your profile, so the syllabus below is the foundation — your actual round will drill into what you listed. Be ready to defend every line in your resume.",
    sections: [
      {
        heading: "Programming Fundamentals",
        topics: [
          "Data structures: arrays, strings, linked lists, stacks, queues",
          "Hash maps, sets, trees (BST), heaps and graphs",
          "Time & space complexity (Big-O) of common operations",
          "Sorting (bubble, merge, quick) and binary search",
          "Recursion and backtracking",
        ],
      },
      {
        heading: "Core CS Subjects",
        topics: [
          "OOP concepts: encapsulation, inheritance, polymorphism, abstraction",
          "DBMS: normalization, joins, indexes, ACID and transactions",
          "SQL queries — select, group by, having, subqueries",
          "Operating systems: processes, threads, scheduling, deadlocks",
          "Computer networks: TCP/UDP, HTTP, DNS, the OSI layers",
        ],
      },
      {
        heading: "Projects on Your Profile",
        topics: [
          "Be able to explain the architecture of each project",
          "Why you chose a particular tech or library",
          "The hardest bug you fixed and how",
          "What you would improve or scale about it",
          "Your specific contribution vs the team's",
        ],
      },
      {
        heading: "Skills You Listed",
        topics: [
          "For each language/framework: a common pitfall and how to avoid it",
          "A real example where you used it",
          "Its latest features and best practices",
          "Where it shines vs where another tool is better",
        ],
      },
      {
        heading: "Problem Solving",
        topics: [
          "Explaining your thought process out loud",
          "Clarifying the problem before coding",
          "Edge cases and testing your own solution",
          "Optimising an initial brute-force approach",
        ],
      },
    ],
    tips: [
      "Re-read your own resume the night before — interviewers pull questions from it.",
      "For every project, prepare: problem, your role, tech stack, challenges, outcome.",
      "If you don't know an answer, explain how you'd find out — honesty beats bluffing.",
    ],
  },

  // Round 4 — HR
  4: {
    intro:
      "A culture-fit round about you — your motivations, strengths, career goals and expectations. There are no technical traps, but vague or rehearsed answers score low.",
    sections: [
      {
        heading: "Self Introduction",
        topics: [
          "A crisp 60-second introduction (education, skills, projects)",
          "Highlighting one strength and one achievement",
          "Connecting your background to the target role",
        ],
      },
      {
        heading: "Motivation & Career Goals",
        topics: [
          "Why this company and this role specifically",
          "Where you see yourself in 3–5 years",
          "Why this domain / technology interests you",
          "Short-term vs long-term goals",
        ],
      },
      {
        heading: "Strengths & Weaknesses",
        topics: [
          "One strength with a concrete example backing it",
          "A genuine weakness and what you are doing to improve it",
          "Avoid clichés like 'I'm a perfectionist'",
        ],
      },
      {
        heading: "Culture Fit",
        topics: [
          "Working in a team vs independently — your preference and why",
          "How you handle pressure and tight deadlines",
          "Adaptability to change and learning new things",
          "Values you look for in a workplace",
        ],
      },
      {
        heading: "Expectations & Logistics",
        topics: [
          "Salary expectation (research the market range first)",
          "Notice period and joining date",
          "Willingness to relocate and travel",
          "Questions to ask the interviewer (always have 2–3 ready)",
        ],
      },
    ],
    tips: [
      "Research the company beforehand — name one thing you genuinely like.",
      "Keep answers to 60–90 seconds; don't ramble.",
      "Prepare 2–3 thoughtful questions to ask at the end.",
    ],
  },
};

function SyllabusPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-3">
          <BookOpen className="text-primary h-6 w-6" />
          <h1 className="text-3xl font-bold">Preparation syllabus</h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Everything you should study before each of the four rounds. Questions are generated fresh
          each attempt, so learn the underlying topics — not specific answers.
        </p>

        <div className="mt-10 space-y-12">
          {ROUNDS.map((r) => {
            const s = SYLLABI[r.round];
            return (
              <section key={r.round} id={r.slug} className="scroll-mt-20">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <div className="text-primary text-sm font-semibold">Round {r.round}</div>
                    <h2 className="mt-1 text-2xl font-bold">{r.name.split("— ")[1]}</h2>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {r.count} questions · ~{r.minutes} min ·{" "}
                    {r.format === "mcq" ? "multiple choice" : "written answers"}
                  </span>
                </div>
                <p className="text-muted-foreground mt-3 max-w-3xl text-sm">{s.intro}</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {s.sections.map((sec) => (
                    <Card key={sec.heading} className="glow-panel border-border/70">
                      <CardContent className="p-5">
                        <h3 className="font-semibold">{sec.heading}</h3>
                        <ul className="mt-3 space-y-2">
                          {sec.topics.map((t) => (
                            <li key={t} className="text-muted-foreground flex items-start gap-2 text-sm">
                              <CheckCircle2 className="text-primary/70 mt-0.5 h-4 w-4 shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="bg-primary/5 border-primary/30 mt-4 rounded-lg border p-4">
                  <div className="text-primary text-xs font-semibold uppercase tracking-wide">
                    Quick tips
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {s.tips.map((t) => (
                      <li key={t} className="text-sm">
                        · {t}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-5">
                  <Link to="/interview/$slug" params={{ slug: r.slug }}>
                    <Button size="sm">
                      Attempt this round <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
