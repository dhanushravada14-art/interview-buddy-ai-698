import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, Cpu, Network, Boxes } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, ErrorState } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { listActivities } from "@/lib/activities.functions";
import { areaStats } from "@/lib/readiness";
import { CORE_CS_SUBJECTS } from "@/lib/core-cs";

const title = "Core CS — DBMS, OS, CN, OOP — PrepRounds";
const description =
  "Practice DBMS, Operating Systems, Computer Networks and OOP with topic-wise AI quizzes and model interview answers.";

export const Route = createFileRoute("/_authenticated/core-cs")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CoreCsIndex,
});

const ICONS = { dbms: Database, os: Cpu, cn: Network, oop: Boxes } as const;

function CoreCsIndex() {
  const fetchActivities = useServerFn(listActivities);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["activities"],
    queryFn: () => fetchActivities({}),
  });

  const stats = data ? areaStats(data) : [];
  const scoreFor = (area: string) => stats.find((s) => s.area === area)?.score ?? null;

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <PageHeader
          eyebrow="Core CS Fundamentals"
          title="Core CS"
          description="DBMS, Operating Systems, Computer Networks and OOP — the fundamentals every technical round probes. Pick a subject to drill topic-wise quizzes and interview questions."
        />

        {isError ? (
          <div className="mt-8">
            <ErrorState message={error instanceof Error ? error.message : "Could not load your scores."} onRetry={refetch} />
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {CORE_CS_SUBJECTS.map((s) => {
              const Icon = ICONS[s.slug];
              const score = scoreFor(s.areaTopic);
              return (
                <Link key={s.slug} to="/core-cs/$subject" params={{ subject: s.slug }}>
                  <Card className="glow-panel border-border/70 h-full transition-colors hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="accent-surface flex h-10 w-10 items-center justify-center rounded-lg">
                          <Icon className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <ArrowRight className="text-muted-foreground h-4 w-4" />
                      </div>
                      <h2 className="mt-4 text-xl font-bold">{s.name}</h2>
                      <p className="text-muted-foreground mt-1 text-sm">{s.tagline}</p>
                      <p className="text-muted-foreground mt-3 text-xs">{s.topics.length} topics</p>
                      <div className="mt-4">
                        <div className="text-muted-foreground flex items-center justify-between text-xs">
                          <span>Your score</span>
                          <span className="font-medium text-foreground">
                            {isLoading ? "…" : score === null ? "Not attempted" : `${score}/100`}
                          </span>
                        </div>
                        <Progress className="mt-1.5" value={isLoading ? 0 : (score ?? 0)} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </AppShell>
  );
}
