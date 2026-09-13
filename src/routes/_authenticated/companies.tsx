import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, ErrorState } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { listActivities } from "@/lib/activities.functions";
import { getTargetCompanies, listCompanies, toggleTargetCompany } from "@/lib/companies.functions";
import { companyReadiness } from "@/lib/companies";

const title = "Companies — PrepRounds";
const description =
  "Browse mass-recruiter companies, mark your targets and see an indicative readiness score based on your practice.";

export const Route = createFileRoute("/_authenticated/companies")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const fetchCompanies = useServerFn(listCompanies);
  const fetchTargets = useServerFn(getTargetCompanies);
  const fetchActivities = useServerFn(listActivities);
  const toggleTarget = useServerFn(toggleTargetCompany);
  const qc = useQueryClient();

  const companies = useQuery({ queryKey: ["companies"], queryFn: () => fetchCompanies({}) });
  const targets = useQuery({ queryKey: ["target-companies"], queryFn: () => fetchTargets({}) });
  const activities = useQuery({ queryKey: ["activities"], queryFn: () => fetchActivities({}) });

  const toggle = useMutation({
    mutationFn: (slug: string) => toggleTarget({ data: { slug } }),
    onSuccess: (res) => qc.setQueryData(["target-companies"], res.target_companies),
    onError: (e: Error) => toast.error(e.message),
  });

  const isLoading = companies.isLoading || activities.isLoading;
  const isError = companies.isError;

  return (
    <AppShell>
      <main className="mx-auto max-w-5xl px-4 py-12">
        <PageHeader
          eyebrow="Placements"
          title="Companies"
          description="Mass-recruiter hiring patterns are indicative and configurable — not a guarantee of what any drive will actually ask. Use them to focus your prep, not as a promise."
        />

        {isError && (
          <div className="mt-8">
            <ErrorState
              message={companies.error instanceof Error ? companies.error.message : "Could not load companies."}
              onRetry={() => companies.refetch()}
            />
          </div>
        )}

        {!isError && !isLoading && (companies.data ?? []).length === 0 && (
          <div className="mt-8">
            <EmptyState title="No companies yet" description="Check back soon." />
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border-border/70 h-40 animate-pulse rounded-xl border" />
            ))}

          {!isLoading &&
            (companies.data ?? []).map((c) => {
              const isTarget = (targets.data ?? []).includes(c.slug);
              const readiness = activities.data
                ? companyReadiness(c, activities.data)
                : { percent: 0, breakdown: [] };
              return (
                <Card key={c.slug} className="glow-panel border-border/70">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to="/companies/$slug" params={{ slug: c.slug }} className="hover:underline">
                            <h2 className="text-xl font-bold">{c.name}</h2>
                          </Link>
                          <Badge variant="secondary">{c.difficulty}</Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm">{c.category}</p>
                      </div>
                      <Button
                        variant={isTarget ? "default" : "outline"}
                        size="icon"
                        aria-label={isTarget ? "Remove from targets" : "Mark as target"}
                        onClick={() => toggle.mutate(c.slug)}
                      >
                        <Star className={`h-4 w-4 ${isTarget ? "fill-current" : ""}`} />
                      </Button>
                    </div>
                    <p className="text-muted-foreground mt-3 text-sm">{c.description}</p>

                    <div className="mt-4">
                      <div className="text-muted-foreground flex items-center justify-between text-xs">
                        <span>Your readiness</span>
                        <span className="font-medium text-foreground">{readiness.percent}%</span>
                      </div>
                      <Progress className="mt-1.5" value={readiness.percent} />
                    </div>

                    <Link to="/companies/$slug" params={{ slug: c.slug }}>
                      <Button variant="link" className="mt-2 px-0">
                        View prep dashboard →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </main>
    </AppShell>
  );
}
