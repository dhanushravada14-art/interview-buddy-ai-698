import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Code2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, ErrorState } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DSA_TOPICS, problemsByTopic } from "@/lib/dsa-problems";
import { listSubmissions } from "@/lib/dsa.functions";

const title = "DSA & Coding Practice — PrepRounds";
const description = "Solve data structures and algorithms problems with an in-browser judge and AI review.";

export const Route = createFileRoute("/_authenticated/dsa")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: DsaListPage,
});

const difficultyVariant: Record<string, "secondary" | "default" | "destructive"> = {
  Easy: "secondary",
  Medium: "default",
  Hard: "destructive",
};

function DsaListPage() {
  const fetchSubmissions = useServerFn(listSubmissions);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["coding-submissions"],
    queryFn: () => fetchSubmissions({}),
  });

  const solvedSlugs = new Set(
    (data ?? []).filter((s) => s.status === "accepted").map((s) => s.problem_slug),
  );
  const grouped = problemsByTopic();

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <PageHeader
          eyebrow="Practice"
          title="DSA & Coding"
          description="20 hand-picked problems across core DSA topics. Run against sample tests, then submit for a full judge run and AI review."
        />

        {isError && (
          <ErrorState
            message={error instanceof Error ? error.message : "Could not load your progress."}
            onRetry={() => refetch()}
          />
        )}

        {DSA_TOPICS.map((topic) => (
          <section key={topic} className="space-y-3">
            <h2 className="text-lg font-semibold">{topic}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[topic].map((p) => {
                const solved = solvedSlugs.has(p.slug);
                return (
                  <Link key={p.slug} to="/dsa/$slug" params={{ slug: p.slug }}>
                    <Card className="hover:border-primary/50 h-full transition-colors">
                      <CardContent className="flex flex-col gap-2 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-medium">
                            <Code2 className="text-muted-foreground h-4 w-4" />
                            {p.title}
                          </div>
                          {solved && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <Badge variant={difficultyVariant[p.difficulty]} className="w-fit">
                          {p.difficulty}
                        </Badge>
                        {isLoading && <Skeleton className="h-3 w-16" />}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              {grouped[topic].length === 0 && (
                <EmptyState title="No problems yet" description="More problems coming soon." />
              )}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
