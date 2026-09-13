import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, Loader2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, ErrorState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { withRetry } from "@/lib/retry";
import { subjectBySlug } from "@/lib/core-cs";
import {
  generateAnswer,
  generateQuestions,
  generateQuiz,
  submitQuiz,
} from "@/lib/core-cs.functions";
import type { CoreCsQuizQuestion } from "@/lib/core-cs.server";

export const Route = createFileRoute("/_authenticated/core-cs/$subject")({
  head: ({ params }) => {
    const subject = subjectBySlug(params.subject);
    const title = subject ? `${subject.name} — Core CS — PrepRounds` : "Core CS — PrepRounds";
    const description = subject
      ? `Topic-wise AI quizzes and interview questions for ${subject.name}: ${subject.tagline}`
      : "Core CS subject not found.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CoreCsSubjectPage,
});

function CoreCsSubjectPage() {
  const { subject: subjectSlug } = Route.useParams();
  const subject = subjectBySlug(subjectSlug);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  if (!subject) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-4 py-20">
          <EmptyState title="Unknown subject" description="This Core CS subject doesn't exist." />
        </main>
      </AppShell>
    );
  }

  const topic = subject.topics.find((t) => t.slug === activeTopic) ?? null;

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-12">
        <PageHeader
          eyebrow="Core CS"
          title={subject.name}
          description={subject.tagline}
          actions={
            <Link to="/core-cs">
              <Button variant="outline" size="sm">
                All subjects
              </Button>
            </Link>
          }
        />

        {!topic ? (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {subject.topics.map((t) => (
              <Card
                key={t.slug}
                className="border-border/70 cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => setActiveTopic(t.slug)}
              >
                <CardContent className="p-5">
                  <h3 className="font-semibold">{t.name}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">{t.summary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <Button variant="ghost" size="sm" onClick={() => setActiveTopic(null)}>
              ← Back to topics
            </Button>
            <h2 className="mt-3 text-2xl font-bold">{topic.name}</h2>
            <p className="text-muted-foreground mt-1">{topic.summary}</p>

            <TopicQuiz subjectSlug={subject.slug} topicSlug={topic.slug} />
            <TopicQuestions subjectSlug={subject.slug} topicSlug={topic.slug} />
          </div>
        )}
      </main>
    </AppShell>
  );
}

function TopicQuiz({ subjectSlug, topicSlug }: { subjectSlug: string; topicSlug: string }) {
  const genQuiz = useServerFn(generateQuiz);
  const submit = useServerFn(submitQuiz);

  const [questions, setQuestions] = useState<CoreCsQuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [graded, setGraded] = useState(false);
  const [result, setResult] = useState<{ score: number; right: number; total: number } | null>(
    null,
  );

  const load = useMutation({
    mutationFn: () => withRetry(() => genQuiz({ data: { subject: subjectSlug, topic: topicSlug } })),
    onSuccess: (qs) => {
      setQuestions(qs);
      setAnswers({});
      setGraded(false);
      setResult(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grade = useMutation({
    mutationFn: () =>
      withRetry(() =>
        submit({
          data: {
            subject: subjectSlug,
            topic: topicSlug,
            answers: (questions ?? []).map((_, i) => answers[i] ?? -1),
            correct: (questions ?? []).map((q) => q.correct_index),
          },
        }),
      ),
    onSuccess: (res) => {
      setResult(res);
      setGraded(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="glow-panel mt-6 border-border/70">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold">10-question quiz</h3>
            <p className="text-muted-foreground text-sm">Freshly generated MCQs on this topic.</p>
          </div>
          {!questions && (
            <Button onClick={() => load.mutate()} disabled={load.isPending}>
              {load.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {load.isPending ? "Generating…" : "Start quiz"}
            </Button>
          )}
        </div>

        {load.isError && (
          <div className="mt-4">
            <ErrorState message={load.error.message} onRetry={() => load.mutate()} />
          </div>
        )}

        {questions && !graded && (
          <div className="mt-6 space-y-6">
            {questions.map((q, i) => (
              <div key={q.id} className="border-border/70 border-t pt-5 first:border-t-0 first:pt-0">
                <p className="font-medium">
                  {i + 1}. {q.question}
                </p>
                <RadioGroup
                  className="mt-3 space-y-2"
                  value={answers[i] !== undefined ? String(answers[i]) : ""}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [i]: Number(v) }))}
                >
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="border-border/70 flex items-center gap-3 rounded-lg border p-2.5">
                      <RadioGroupItem value={String(oi)} id={`q${i}-o${oi}`} />
                      <Label htmlFor={`q${i}-o${oi}`} className="cursor-pointer font-normal">
                        {opt}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button
              disabled={grade.isPending || Object.keys(answers).length < questions.length}
              onClick={() => grade.mutate()}
            >
              {grade.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit quiz
            </Button>
          </div>
        )}

        {questions && graded && result && (
          <div className="mt-6">
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold">{result.score}</span>
              <span className="text-muted-foreground pb-1 text-sm">
                / 100 · {result.right} of {result.total} correct
              </span>
            </div>
            <Progress className="mt-3" value={result.score} />

            <div className="mt-6 space-y-4">
              {questions.map((q, i) => {
                const picked = answers[i];
                const isRight = picked === q.correct_index;
                return (
                  <div key={q.id} className="border-border/70 rounded-lg border p-4">
                    <div className="flex items-start gap-2">
                      {isRight ? (
                        <CheckCircle2 className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium">
                          {i + 1}. {q.question}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Your answer: {q.options[picked ?? -1] ?? "(skipped)"}
                          {!isRight && ` · Correct: ${q.options[q.correct_index]}`}
                        </p>
                        <p className="text-muted-foreground mt-2 text-sm italic">{q.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button className="mt-6" variant="outline" onClick={() => load.mutate()}>
              Try another quiz
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TopicQuestions({ subjectSlug, topicSlug }: { subjectSlug: string; topicSlug: string }) {
  const fetchQuestions = useServerFn(generateQuestions);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["core-cs-questions", subjectSlug, topicSlug],
    queryFn: () => fetchQuestions({ data: { subject: subjectSlug, topic: topicSlug } }),
  });

  return (
    <Card className="mt-6 border-border/70">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold">Common interview questions</h3>
        <p className="text-muted-foreground text-sm">
          Expand a question for an AI-written model answer.
        </p>

        {isLoading && (
          <div className="text-muted-foreground mt-4 flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading questions…
          </div>
        )}
        {isError && (
          <div className="mt-4">
            <ErrorState message={error instanceof Error ? error.message : "Failed to load."} onRetry={refetch} />
          </div>
        )}

        <div className="mt-4 space-y-2">
          {(data ?? []).map((q, i) => (
            <QuestionRow key={i} subjectSlug={subjectSlug} topicSlug={topicSlug} question={q} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionRow({
  subjectSlug,
  topicSlug,
  question,
}: {
  subjectSlug: string;
  topicSlug: string;
  question: string;
}) {
  const fetchAnswer = useServerFn(generateAnswer);
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["core-cs-answer", subjectSlug, topicSlug, question],
    queryFn: () => fetchAnswer({ data: { subject: subjectSlug, topic: topicSlug, question } }),
    enabled: open,
  });

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="border-border/70 rounded-lg border p-3">
        <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 text-left">
          <span className="font-medium">{question}</span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          {isLoading && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Writing a model answer…
            </div>
          )}
          {isError && (
            <ErrorState message={error instanceof Error ? error.message : "Failed to load."} onRetry={refetch} />
          )}
          {data && (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{data.answer}</ReactMarkdown>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
