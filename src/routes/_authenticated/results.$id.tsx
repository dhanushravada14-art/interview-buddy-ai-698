import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { getSession } from "@/lib/interview.functions";
import { scoreLabel } from "@/lib/rounds";

const title = "Round result — PrepRounds";
const description =
  "Your marks, per-question feedback and ideal answers for this mock interview round.";

export const Route = createFileRoute("/_authenticated/results/$id")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultsPage,
});

type Q = { question: string; topic: string; options?: string[]; correct_index?: number };
type P = { marks: number; verdict: string; ideal_answer: string };

function ResultsPage() {
  const { id } = Route.useParams();
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const fetchSession = useServerFn(getSession);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["session", id],
    queryFn: () => fetchSession({ data: { id } }),
    enabled: !!session,
  });

  if (isLoading || !data) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-20 text-muted-foreground">Loading result…</main>
      </AppShell>
    );
  }

  const questions = (data.questions ?? []) as Q[];
  const per = (data.per_question ?? []) as P[];
  const answers = (data.answers ?? []) as string[];
  const score = data.score ?? 0;

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Card className="glow-panel border-border/70">
          <CardContent className="p-8">
            <div className="text-primary text-sm font-semibold">{data.round_name}</div>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-6xl font-bold">{score}</span>
              <span className="text-muted-foreground pb-2">/ 100 · {scoreLabel(score)}</span>
            </div>
            <Progress className="mt-4" value={score} />
            {data.feedback && (
              <div className="prose prose-sm prose-invert mt-6 max-w-none">
                <ReactMarkdown>{data.feedback}</ReactMarkdown>
              </div>
            )}
            <div className="mt-8 flex gap-3">
              <Link to="/dashboard">
                <Button variant="outline">Back to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <h2 className="mt-12 text-2xl font-bold">Question by question</h2>
        <div className="mt-4 space-y-4">
          {questions.map((q, i) => {
            const p = per[i];
            const given = answers[i] ?? "";
            const shown = q.options
              ? (q.options[Number(given)] ?? "No answer")
              : given || "No answer";
            return (
              <Card key={i} className="border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium">
                      {i + 1}. {q.question}
                    </p>
                    <span className="text-primary shrink-0 text-sm font-semibold">
                      {p?.marks ?? 0}/10
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm">
                    <span className="text-foreground font-medium">Your answer: </span>
                    {shown}
                  </p>
                  {p?.verdict && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      <span className="text-foreground font-medium">Feedback: </span>
                      {p.verdict}
                    </p>
                  )}
                  {p?.ideal_answer && (
                    <p className="text-muted-foreground bg-muted/40 mt-3 rounded-lg p-3 text-sm">
                      <span className="text-foreground font-medium">Ideal answer: </span>
                      {p.ideal_answer}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </AppShell>
  );
}
