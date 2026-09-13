import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Loader2, Play, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SQL_QUESTIONS, SQL_SCHEMAS, type SqlQuestion } from "@/lib/sql-lab";
import { explainSql } from "@/lib/sql-lab.functions";
import { logActivity } from "@/lib/activities.functions";

const title = "SQL Interview Lab — PrepRounds";
const description = "Practice SQL queries against sample schemas, right in your browser, with AI feedback.";

export const Route = createFileRoute("/_authenticated/sql")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: SqlLabPage,
});

type QueryResult = { columns: string[]; values: unknown[][] } | null;

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function SqlLabPage() {
  const mounted = useMounted();
  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
        <PageHeader
          eyebrow="Practice"
          title="SQL Interview Lab"
          description="Run real SQL against sample schemas in your browser (no server needed), compare with the expected result, and get AI feedback."
        />
        {mounted ? <SqlLabBody /> : <SqlLabSkeleton />}
      </div>
    </AppShell>
  );
}

function SqlLabSkeleton() {
  return (
    <Card>
      <CardContent className="text-muted-foreground p-8 text-sm">Loading SQL engine…</CardContent>
    </Card>
  );
}

function SqlLabBody() {
  const [dbBySchema, setDbBySchema] = useState<Record<string, unknown>>({});
  const [sqlReady, setSqlReady] = useState(false);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const SQLRef = useRef<any>(null);

  const [questionIdx, setQuestionIdx] = useState(0);
  const question: SqlQuestion = SQL_QUESTIONS[questionIdx];
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<QueryResult>(null);
  const [expected, setExpected] = useState<QueryResult>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  const explainFn = useServerFn(explainSql);
  const logProgress = useServerFn(logActivity);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initSqlJs = (await import("sql.js")).default;
        const SQL = await initSqlJs({
          locateFile: (f: string) => `https://sql.js.org/dist/${f}`,
        });
        if (cancelled) return;
        SQLRef.current = SQL;
        const dbs: Record<string, unknown> = {};
        for (const schema of SQL_SCHEMAS) {
          const db = new SQL.Database();
          db.run(schema.setupSql);
          dbs[schema.id] = db;
        }
        setDbBySchema(dbs);
        setSqlReady(true);
      } catch (e) {
        setSqlError(e instanceof Error ? e.message : "Failed to load SQL engine");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setQuery("");
    setResult(null);
    setExpected(null);
    setRunError(null);
    setExplanation(null);
  }, [questionIdx]);

  function execOn(db: any, sql: string): QueryResult {
    const res = db.exec(sql);
    if (!res.length) return { columns: [], values: [] };
    return { columns: res[0].columns, values: res[0].values };
  }

  function runQuery() {
    setRunError(null);
    if (!question.schemaId) {
      toast("This is a concept question — no query to run. Write your explanation and ask AI for feedback.");
      return;
    }
    const db = dbBySchema[question.schemaId];
    if (!db) return;
    try {
      const r = execOn(db, query);
      setResult(r);
      if (question.expectedSql) {
        setExpected(execOn(db, question.expectedSql));
      }
      logProgress({
        data: {
          kind: "sql",
          topic: "SQL",
          subtopic: question.subtopic,
          title: question.title,
          score: 100,
          details: { questionId: question.id },
        },
      }).catch(() => undefined);
    } catch (e) {
      setRunError(e instanceof Error ? e.message : "Query failed");
    }
  }

  const explainMutation = useMutation({
    mutationFn: () =>
      explainFn({
        data: {
          mode: question.schemaId ? "query" : "concept",
          question: question.prompt,
          userInput: query || "(empty)",
          schemaSql: question.schemaId
            ? SQL_SCHEMAS.find((s) => s.id === question.schemaId)?.setupSql
            : undefined,
        },
      }),
    onSuccess: (data) => {
      setExplanation(data.explanation);
      logProgress({
        data: {
          kind: "sql",
          topic: "SQL",
          subtopic: question.subtopic,
          title: question.title,
          score: 100,
          details: { questionId: question.id, ai: true },
        },
      }).catch(() => undefined);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "AI explain failed"),
  });

  const schema = useMemo(
    () => SQL_SCHEMAS.find((s) => s.id === question.schemaId),
    [question.schemaId],
  );

  if (sqlError) {
    return <EmptyState title="Could not load SQL engine" description={sqlError} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">Questions</h2>
        <div className="max-h-[70vh] space-y-1 overflow-y-auto pr-1">
          {SQL_QUESTIONS.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setQuestionIdx(i)}
              className={`block w-full rounded-md px-2 py-2 text-left text-sm ${
                i === questionIdx ? "bg-accent font-medium" : "hover:bg-accent/50"
              }`}
            >
              <div>{q.title}</div>
              <div className="text-muted-foreground mt-0.5 flex gap-1 text-xs">
                <Badge variant="outline">{q.subtopic}</Badge>
                <Badge variant="secondary">{q.difficulty}</Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{question.subtopic}</Badge>
              <Badge variant="secondary">{question.difficulty}</Badge>
              {schema && <Badge variant="default">{schema.name}</Badge>}
            </div>
            <h3 className="font-semibold">{question.title}</h3>
            <p className="text-muted-foreground text-sm">{question.prompt}</p>
            {schema && (
              <details className="text-xs">
                <summary className="text-primary cursor-pointer">View schema</summary>
                <pre className="bg-muted mt-2 overflow-x-auto rounded-md p-2">{schema.setupSql.trim()}</pre>
              </details>
            )}
          </CardContent>
        </Card>

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={question.schemaId ? "Write your SQL query here…" : "Type your explanation here…"}
          spellCheck={false}
          className="border-border bg-card min-h-[140px] w-full rounded-lg border p-3 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
        />

        <div className="flex gap-2">
          <Button size="sm" onClick={runQuery} disabled={!sqlReady && !!question.schemaId}>
            {!sqlReady && question.schemaId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => explainMutation.mutate()}
            disabled={explainMutation.isPending}
          >
            {explainMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Ask AI
          </Button>
        </div>

        {runError && (
          <Card>
            <CardContent className="text-destructive p-4 text-sm">{runError}</CardContent>
          </Card>
        )}

        {result && (
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultTable title="Your result" result={result} />
            {expected && <ResultTable title="Expected result" result={expected} />}
          </div>
        )}

        {explanation && (
          <Card>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-4">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ResultTable({ title, result }: { title: string; result: QueryResult }) {
  if (!result || result.columns.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-2 text-sm font-semibold">{title}</h4>
          <p className="text-muted-foreground text-xs">No rows returned.</p>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardContent className="overflow-x-auto p-4">
        <h4 className="mb-2 text-sm font-semibold">{title}</h4>
        <Table>
          <TableHeader>
            <TableRow>
              {result.columns.map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.values.map((row, i) => (
              <TableRow key={i}>
                {row.map((cell, j) => (
                  <TableCell key={j}>{String(cell)}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
