import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, listSessions } from "@/lib/interview.functions";
import { ROUNDS, scoreLabel } from "@/lib/rounds";

const title = "Dashboard — PrepRounds Mock Interviews";
const description =
  "Start any of the four mock interview rounds and review the marks and feedback from your past attempts.";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const fetchSessions = useServerFn(listSessions);
  const fetchProfile = useServerFn(getProfile);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data: sessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions({}),
    enabled: !!session,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile({}),
    enabled: !!session,
  });

  const profileReady = !!profile && (profile.skills?.length ?? 0) > 0 && !!profile.projects;

  function bestFor(round: number) {
    const scores = (sessions ?? [])
      .filter((s) => s.round === round && s.completed && s.score !== null)
      .map((s) => s.score as number);
    return scores.length ? Math.max(...scores) : null;
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold">Your interview process</h1>
        <p className="text-muted-foreground mt-2">
          Four rounds, in any order. Every attempt generates new questions.
        </p>

        {!profileReady && (
          <Card className="border-primary/40 bg-primary/5 mt-6">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <p className="text-sm">
                Add your skills and projects first — the technical and managerial rounds are built
                from them.
              </p>
              <Link to="/profile">
                <Button size="sm">Complete profile</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {ROUNDS.map((r) => {
            const best = bestFor(r.round);
            return (
              <Card key={r.round} className="glow-panel border-border/70">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-primary text-sm font-semibold">Round {r.round}</div>
                      <h2 className="mt-1 text-xl font-semibold">{r.name.split("— ")[1]}</h2>
                    </div>
                    {best !== null && (
                      <div className="text-right">
                        <div className="text-2xl font-bold">{best}</div>
                        <div className="text-muted-foreground text-xs">best score</div>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm">{r.tagline}</p>
                  {best !== null && (
                    <div className="mt-4">
                      <Progress value={best} />
                      <p className="text-muted-foreground mt-1 text-xs">{scoreLabel(best)}</p>
                    </div>
                  )}
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">
                      {r.count} questions · ~{r.minutes} min
                    </span>
                    <Link to="/interview/$slug" params={{ slug: r.slug }}>
                      <Button size="sm">
                        Start round <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <h2 className="mt-14 text-2xl font-bold">Past attempts</h2>
        <div className="mt-4 space-y-3">
          {(sessions ?? []).filter((s) => s.completed).length === 0 && (
            <p className="text-muted-foreground text-sm">No completed rounds yet.</p>
          )}
          {(sessions ?? [])
            .filter((s) => s.completed)
            .map((s) => (
              <Link key={s.id} to="/results/$id" params={{ id: s.id }} className="block">
                <Card className="border-border/70 transition-colors hover:border-primary/60">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-success h-4 w-4" />
                      <div>
                        <div className="text-sm font-medium">{s.round_name}</div>
                        <div className="text-muted-foreground text-xs">
                          {new Date(s.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-lg font-semibold">{s.score}/100</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
        </div>
      </main>
    </AppShell>
  );
}