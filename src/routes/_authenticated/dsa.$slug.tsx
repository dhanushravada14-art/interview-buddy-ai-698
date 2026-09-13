import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, Loader2, Play, Send, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { problemBySlug } from "@/lib/dsa-problems";
import { runCode, submitCode, type SupportedLanguage, type TestResult } from "@/lib/dsa.functions";
import { logActivity } from "@/lib/activities.functions";

export const Route = createFileRoute("/_authenticated/dsa/$slug")({
  loader: ({ params }) => {
    const problem = problemBySlug(params.slug);
    if (!problem) throw notFound();
    return problem;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.title} — PrepRounds` : "Problem — PrepRounds";
    const description = loaderData
      ? `Solve "${loaderData.title}" (${loaderData.topic}, ${loaderData.difficulty}) with an in-browser judge.`
      : "DSA coding problem.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: DsaProblemPage,
});

const LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "python", label: "Python" },
  { value: "cpp", label: "C++" },
  { value: "c", label: "C" },
  { value: "java", label: "Java" },
];

const difficultyVariant: Record<string, "secondary" | "default" | "destructive"> = {
  Easy: "secondary",
  Medium: "default",
  Hard: "destructive",
};

function DsaProblemPage() {
  const problem = Route.useLoaderData();
  const [language, setLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState<string>(problem.starter.python);
  const [runResults, setRunResults] = useState<TestResult[] | null>(null);
  const [submitResult, setSubmitResult] = useState<{
    results: TestResult[];
    passed: number;
    total: number;
    status: string;
    review: string | null;
  } | null>(null);

  const doRun = useServerFn(runCode);
  const doSubmit = useServerFn(submitCode);
  const logProgress = useServerFn(logActivity);

  function onLanguageChange(v: string) {
    const lang = v as SupportedLanguage;
    setLanguage(lang);
    setCode(problem.starter[lang]);
  }

  const runMutation = useMutation({
    mutationFn: () => doRun({ data: { slug: problem.slug, language, code } }),
    onSuccess: (data) => {
      setRunResults(data.results);
      const passed = data.results.filter((r) => r.passed).length;
      toast(passed === data.results.length ? "All sample tests passed" : `${passed}/${data.results.length} sample tests passed`);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Run failed"),
  });

  const submitMutation = useMutation({
    mutationFn: () => doSubmit({ data: { slug: problem.slug, language, code } }),
    onSuccess: async (data) => {
      setSubmitResult(data);
      toast(data.status === "accepted" ? "Accepted! 🎉" : `${data.passed}/${data.total} tests passed`);
      try {
        await logProgress({
          data: {
            kind: "coding",
            topic: "DSA",
            subtopic: problem.topic,
            title: problem.title,
            score: Math.round((data.passed / data.total) * 100),
            details: { slug: problem.slug, language, status: data.status },
          },
        });
      } catch {
        // Non-fatal: progress logging failure shouldn't block the result view.
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Submit failed"),
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <Link to="/dsa" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> All problems
        </Link>

        <PageHeader
          eyebrow={problem.topic}
          title={problem.title}
          description={undefined}
          actions={<Badge variant={difficultyVariant[problem.difficulty]}>{problem.difficulty}</Badge>}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-5">
              <ReactMarkdown>{problem.statement}</ReactMarkdown>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runMutation.mutate()}
                  disabled={runMutation.isPending || submitMutation.isPending}
                >
                  {runMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run
                </Button>
                <Button
                  size="sm"
                  onClick={() => submitMutation.mutate()}
                  disabled={runMutation.isPending || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit
                </Button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="border-border bg-card min-h-[320px] w-full rounded-lg border p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
            />

            {runResults && (
              <Card>
                <CardContent className="space-y-2 p-4">
                  <h3 className="text-sm font-semibold">Sample test results</h3>
                  {runResults.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      {r.passed ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium">Test {i + 1}: {r.passed ? "Passed" : "Failed"}</div>
                        {!r.passed && (
                          <div className="text-muted-foreground mt-1 space-y-0.5 font-mono text-xs break-all">
                            <div>expected: {r.expected}</div>
                            <div>actual: {r.actual || "(empty)"}</div>
                            {r.stderr && <div>stderr: {r.stderr.slice(0, 200)}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {submitResult && (
              <Card>
                <CardContent className="p-4">
                  <Tabs defaultValue="results">
                    <TabsList>
                      <TabsTrigger value="results">
                        Results ({submitResult.passed}/{submitResult.total})
                      </TabsTrigger>
                      <TabsTrigger value="review">AI Review</TabsTrigger>
                    </TabsList>
                    <TabsContent value="results" className="space-y-2 pt-3">
                      {submitResult.results.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          {r.passed ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          ) : (
                            <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                          )}
                          <div>Test {i + 1}: {r.passed ? "Passed" : "Failed"}</div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="review" className="pt-3">
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{submitResult.review ?? "No review available."}</ReactMarkdown>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
