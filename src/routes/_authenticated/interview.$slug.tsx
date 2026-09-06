import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mic, MicOff } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDictation } from "@/hooks/useDictation";
import { withRetry } from "@/lib/retry";
import { askFollowup, startRound, submitRound } from "@/lib/interview.functions";
import { roundBySlug } from "@/lib/rounds";

export const Route = createFileRoute("/_authenticated/interview/$slug")({
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
  const begin = useServerFn(startRound);
  const finish = useServerFn(submitRound);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"idle" | "loading" | "running" | "grading">("idle");
  const [secondsLeft, setSecondsLeft] = useState(0);

  const indexRef = useRef(index);
  indexRef.current = index;
  const appendSpeech = useCallback((text: string) => {
    if (!text) return;
    setAnswers((prev) => {
      const next = [...prev];
      const i = indexRef.current;
      const existing = next[i] ?? "";
      next[i] = existing ? `${existing.replace(/\s+$/, "")} ${text}` : text;
      return next;
    });
  }, []);
  const dictation = useDictation(appendSpeech);
  const stopDictation = dictation.stop;

  // Never keep the mic open across questions or after leaving the round.
  useEffect(() => {
    stopDictation();
  }, [index, phase, stopDictation]);

  useEffect(() => {
    if (phase !== "running" || secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, secondsLeft]);

  async function start() {
    setPhase("loading");
    try {
      const row = await withRetry(() => begin({ data: { slug } }));
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
    stopDictation();
    setPhase("grading");
    try {
      await withRetry(() => finish({ data: { id: sessionId, answers } }));
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
                <li>· Format: {meta.format === "mcq" ? "multiple choice" : "written answers"}</li>
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
            <div className="bg-background/85 sticky top-0 z-20 -mx-4 px-4 py-3 backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-primary text-sm font-semibold">{meta.name}</div>
                  <h1 className="text-muted-foreground truncate text-sm">
                    Question {index + 1} of {questions.length} · {current.topic}
                  </h1>
                </div>
                <div
                  className={`rounded-lg border px-3 py-1.5 font-mono text-lg tabular-nums ${
                    secondsLeft <= 120
                      ? "border-destructive/50 text-destructive animate-pulse"
                      : "border-border/70"
                  }`}
                  aria-label="Time remaining"
                >
                  {mm}:{ss}
                </div>
              </div>
              <Progress className="mt-3" value={((index + 1) / questions.length) * 100} />
            </div>

            <div className="text-muted-foreground mt-4 flex flex-wrap gap-1.5 text-xs">
              {questions.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-7 w-7 rounded-md border transition-colors ${
                    i === index
                      ? "border-primary text-primary font-semibold"
                      : answers[i]
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-border/70 hover:border-primary/50"
                  }`}
                  aria-label={`Go to question ${i + 1}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

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
                  <div className="mt-6">
                    <Textarea
                      rows={9}
                      placeholder="Answer as you would out loud in the interview…"
                      value={
                        dictation.interim
                          ? `${answers[index] ?? ""}${answers[index] ? " " : ""}${dictation.interim}`
                          : (answers[index] ?? "")
                      }
                      onChange={(e) => {
                        const next = [...answers];
                        next[index] = e.target.value;
                        setAnswers(next);
                      }}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <Button
                        type="button"
                        variant={dictation.listening ? "default" : "outline"}
                        size="sm"
                        disabled={!dictation.supported}
                        onClick={dictation.toggle}
                      >
                        {dictation.listening ? (
                          <MicOff className="mr-2 h-4 w-4" />
                        ) : (
                          <Mic className="mr-2 h-4 w-4" />
                        )}
                        {dictation.listening ? "Stop recording" : "Answer by voice"}
                      </Button>
                      <span className="text-muted-foreground text-xs">
                        {!dictation.supported
                          ? "Voice answering needs Chrome, Edge or Safari."
                          : dictation.listening
                            ? "Listening… speak your answer, then stop to edit it."
                            : "Speak your answer and we'll transcribe it into the box."}
                      </span>
                    </div>
                  </div>
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
