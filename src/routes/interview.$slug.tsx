import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { startRound, submitRound } from "@/lib/interview.functions";
import { roundBySlug } from "@/lib/rounds";

export const Route = createFileRoute("/interview/$slug")({
  head: ({ params }) => {
    const meta = roundBySlug(params.slug);
    const title = `${meta?.name ?? "Mock interview"} — PrepRounds`;
    const description = meta?.tagline ?? "Take an AI mock interview round personalised to you.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: InterviewPage,
});

type Question = {
  id: number;
  type: "mcq" | "text";
  topic: string;
  question: string;
  options?: string[];
};

function InterviewPage() {
  const { slug } = Route.useParams();
  const meta = roundBySlug(slug);
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const begin = useServerFn(startRound);
  const finish = useServerFn(submitRound);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "loading" | "running" | "grading">("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (phase !== "running" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  async function start() {
    setPhase("loading");
    try {
      const row = await begin({ data: { slug } });
      const qs = (row.questions ?? []) as Question[];
      setSessionId(row.id);
      setQuestions(qs);
      setAnswers(qs.map(() => ""));
      setIndex(0);
      setSecondsLeft((meta?.minutes ?? 15) * 60);
      setPhase("running");
    } catch (e) {
      setPhase("idle");
      toast.error(e instanceof Error ? e.message : "Could not start this round.");
    }
  }

  async function submit() {
    if (!sessionId) return;
    setPhase("grading");
    try {
      await finish({ data: { id: sessionId, answers } });
      navigate({ to: "/results/$id", params: { id: sessionId } });
    } catch (e) {
      setPhase("running");
      toast.error(e instanceof Error ? e.message : "Grading failed. Try again.");
    }
  }

  if (!meta) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-20">
          <h1 className="text-2xl font-bold">Unknown round</h1>
        </main>
      </AppShell>
    );
  }

  const current = questions[index];
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-12">
        {phase === "idle" && (
          <Card className="glow-panel border-border/70">
            <CardContent className="p-8">
              <div className="text-primary text-sm font-semibold">Round {meta.round}</div>
              <h1 className="mt-1 text-3xl font-bold">{meta.name.split("— ")[1]}</h1>
              <p className="text-muted-foreground mt-3">{meta.tagline}</p>
              <ul className="text-muted-foreground mt-6 space-y-1 text-sm">
                <li>· {meta.count} questions</li>
                <li>· Suggested time: {meta.minutes} minutes</li>
                <li>
                  · Format: {meta.format === "mcq" ? "multiple choice" : "written answers"}
                </li>
                <li>· Questions are generated fresh from your profile each attempt</li>
              </ul>
              <Button className="mt-8" size="lg" onClick={start}>
                Begin round
              </Button>
            </CardContent>
          </Card>
        )}

        {(phase === "loading" || phase === "grading") && (
          <div className="flex flex-col items-center gap-4 py-32">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
            <p className="text-muted-foreground text-sm">
              {phase === "loading"
                ? "Your interviewer is preparing questions from your profile…"
                : "Evaluating your answers and assigning marks…"}
            </p>
          </div>
        )}

        {phase === "running" && current && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-primary text-sm font-semibold">{meta.name}</div>
                <h1 className="text-muted-foreground text-sm">
                  Question {index + 1} of {questions.length} · {current.topic}
                </h1>
              </div>
              <div className="font-mono text-lg">
                {mm}:{ss}
              </div>
            </div>
            <Progress className="mt-4" value={((index + 1) / questions.length) * 100} />

            <Card className="glow-panel mt-6 border-border/70">
              <CardContent className="p-6">
                <p className="text-lg font-medium">{current.question}</p>

                {current.type === "mcq" ? (
                  <RadioGroup
                    className="mt-6 space-y-3"
                    value={answers[index] ?? ""}
                    onValueChange={(v) => {
                      const next = [...answers];
                      next[index] = v;
                      setAnswers(next);
                    }}
                  >
                    {(current.options ?? []).map((opt, i) => (
                      <div
                        key={i}
                        className="border-border/70 flex items-center gap-3 rounded-lg border p-3"
                      >
                        <RadioGroupItem value={String(i)} id={`opt-${index}-${i}`} />
                        <Label htmlFor={`opt-${index}-${i}`} className="cursor-pointer font-normal">
                          {opt}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Textarea
                    className="mt-6"
                    rows={9}
                    placeholder="Answer as you would out loud in the interview…"
                    value={answers[index] ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[index] = e.target.value;
                      setAnswers(next);
                    }}
                  />
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
              >
                Previous
              </Button>
              {index < questions.length - 1 ? (
                <Button onClick={() => setIndex((i) => i + 1)}>Next</Button>
              ) : (
                <Button onClick={submit}>Submit round</Button>
              )}
            </div>
          </>
        )}
      </main>
    </AppShell>
  );
}