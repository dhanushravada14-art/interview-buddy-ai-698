import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BrainCircuit, ClipboardCheck, Sparkles, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ROUNDS } from "@/lib/rounds";

const title = "PrepRounds — AI Mock Interviews for First-Time Students";
const description =
  "Practice a full 4-round placement interview: aptitude, managerial, technical and HR. Questions adapt to your own skills and projects, with marks and feedback each round.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const steps = [
  {
    icon: ClipboardCheck,
    title: "1. Build your profile",
    body: "Add your degree, target role, skills and projects. This is what the interviewer reads before every round.",
  },
  {
    icon: BrainCircuit,
    title: "2. Take any round",
    body: "Questions are generated fresh each attempt and adapted to what you actually know and built.",
  },
  {
    icon: Sparkles,
    title: "3. Get marked",
    body: "Every round is scored out of 100 with per-question marks, an ideal answer and honest feedback.",
  },
  {
    icon: Users,
    title: "4. Track progress",
    body: "Your dashboard keeps every attempt so you can see which round still needs work before the real thing.",
  },
];

function Index() {
  return (
    <AppShell>
      <main>
        <section className="hero-surface border-b border-border/60">
          <div className="mx-auto max-w-6xl px-4 py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered placement practice
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl leading-tight font-bold">
              Welcome to mock interview
            </h1>
            <p className="text-muted-foreground mt-5 max-w-2xl text-lg">
              A complete mock hiring process — aptitude, managerial, technical and HR — with
              questions written around your own skills and projects, and marks after every round.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth">
                <Button size="lg">
                  Start free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline">
                  Go to dashboard
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="text-3xl font-bold">The four rounds</h2>
          <p className="text-muted-foreground mt-2">
            Practice them in any order, as many times as you like.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {ROUNDS.map((r) => (
              <Card key={r.round} className="glow-panel border-border/70">
                <CardContent className="p-6">
                  <div className="text-primary text-sm font-semibold">Round {r.round}</div>
                  <h3 className="mt-1 text-xl font-semibold">{r.name.split("— ")[1]}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{r.tagline}</p>
                  <p className="text-muted-foreground mt-4 text-xs">
                    {r.count} questions · about {r.minutes} minutes ·{" "}
                    {r.format === "mcq" ? "multiple choice" : "written answers"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="border-t border-border/60 bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="text-3xl font-bold">How it works</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              {steps.map((s) => (
                <Card key={s.title} className="border-border/70 h-full">
                  <CardContent className="p-6">
                    <s.icon className="text-primary h-5 w-5" />
                    <h3 className="mt-4 font-semibold">{s.title}</h3>
                    <p className="text-muted-foreground mt-2 text-sm">{s.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-10">
              <Link to="/auth">
                <Button size="lg">
                  Create your account <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
          PrepRounds — practice interviews for students facing their first one.
        </footer>
      </main>
    </AppShell>
  );
}
