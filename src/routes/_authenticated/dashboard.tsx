import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  ListChecks,
  Sparkles,
  Target,
  Trophy,
  TriangleAlert,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { getProfile, listSessions } from "@/lib/interview.functions";
import { ROUNDS, scoreLabel } from "@/lib/rounds";

const title = "Dashboard — PrepRounds Mock Interviews";
const description =
  "Track your interview readiness, round-wise scores, progress charts and the round the AI recommends you practise next.";

export const Route = createFileRoute("/_authenticated/dashboard")({
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

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const total = 30;
    const id = setInterval(() => {
      frame += 1;
      setValue(Math.round((target * frame) / total));
      if (frame >= total) clearInterval(id);
    }, 20);
    return () => clearInterval(id);
  }, [target]);
  return value;
}

function Dashboard() {
  const fetchSessions = useServerFn(listSessions);
  const fetchProfile = useServerFn(getProfile);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: () => fetchSessions({}),
  });
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile({}),
  });

  const profileReady = !!profile && (profile.skills?.length ?? 0) > 0 && !!profile.projects;
  const done = (sessions ?? []).filter((s) => s.completed && s.score !== null);

  const bestFor = (round: number) => {
    const scores = done.filter((s) => s.round === round).map((s) => s.score as number);
    return scores.length ? Math.max(...scores) : null;
  };

  const attempted = done.length;
  const roundBests = ROUNDS.map((r) => ({ round: r, best: bestFor(r.round) }));
  const scored = roundBests.filter((r) => r.best !== null);
  const readiness = scored.length
    ? Math.round(scored.reduce((s, r) => s + (r.best as number), 0) / ROUNDS.length)
    : 0;
  const average = attempted
    ? Math.round(done.reduce((s, d) => s + (d.score as number), 0) / attempted)
    : 0;
  const questionsAttempted = done.reduce(
    (s, d) => s + (ROUNDS.find((r) => r.round === d.round)?.count ?? 0),
    0,
  );
  const bestEver = attempted ? Math.max(...done.map((d) => d.score as number)) : 0;

  // Weakest = lowest best score; unattempted rounds count as the weakest of all.
  const weakest =
    roundBests.filter((r) => r.best === null)[0] ??
    [...roundBests].sort((a, b) => (a.best as number) - (b.best as number))[0];

  const animated = useCountUp(readiness);

  const trend = [...done]
    .reverse()
    .map((d, i) => ({ attempt: `#${i + 1}`, score: d.score as number }));
  const byRound = roundBests.map((r) => ({
    name: r.round.name.split("— ")[1]?.replace(" Round", "").replace(" Test", "") ?? "",
    score: r.best ?? 0,
  }));

  const chartConfig = {
    score: { label: "Score", color: "var(--primary)" },
  } satisfies ChartConfig;

  const achievements = [
    { label: "First interview", unlocked: attempted >= 1 },
    { label: "5 interviews done", unlocked: attempted >= 5 },
    { label: "Scored 80+", unlocked: bestEver >= 80 },
    { label: "All four rounds", unlocked: scored.length === 4 },
  ];

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Your interview readiness workspace — scores, trends and what to practise next.
            </p>
          </div>
          <Link to="/interview/$slug" params={{ slug: weakest?.round.slug ?? "aptitude" }}>
            <Button className="transition-transform hover:scale-[1.03]">
              Start mock interview <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

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

        {isLoading ? (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40 md:col-span-2" />
            <Skeleton className="h-40" />
          </div>
        ) : (
          <>
            {/* Readiness + recommendation */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Card className="glow-panel border-border/70 md:col-span-2">
                <CardContent className="p-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-muted-foreground text-sm font-medium">
                        Interview readiness
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-5xl font-bold tabular-nums">{animated}</span>
                        <span className="text-muted-foreground text-lg">/100</span>
                      </div>
                    </div>
                    <span className="text-primary text-sm font-semibold">
                      {scoreLabel(readiness)}
                    </span>
                  </div>
                  <Progress value={animated} className="mt-4 transition-all" />
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {roundBests.map(({ round, best }) => (
                      <Link
                        key={round.round}
                        to="/interview/$slug"
                        params={{ slug: round.slug }}
                        className="border-border/70 hover:border-primary/60 hover:bg-primary/5 rounded-lg border p-3 transition-colors"
                      >
                        <div className="text-muted-foreground text-xs">
                          {round.name.split("— ")[1]}
                        </div>
                        <div className="mt-1 text-2xl font-semibold tabular-nums">
                          {best === null ? "—" : `${best}%`}
                        </div>
                        <Progress value={best ?? 0} className="mt-2 h-1.5" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="flex h-full flex-col p-6">
                  <div className="text-primary flex items-center gap-2 text-sm font-semibold">
                    <TriangleAlert className="h-4 w-4" /> AI recommendation
                  </div>
                  <p className="mt-3 text-sm">
                    {weakest?.best === null || weakest?.best === undefined
                      ? `You haven't attempted the ${weakest?.round.name.split("— ")[1]} yet. Start there to get a full readiness score.`
                      : `Your weakest area is the ${weakest.round.name.split("— ")[1]} at ${weakest.best}%. Practise it to lift your overall readiness.`}
                  </p>
                  <div className="mt-auto pt-5">
                    <Link
                      to="/interview/$slug"
                      params={{ slug: weakest?.round.slug ?? "aptitude" }}
                    >
                      <Button size="sm" className="w-full">
                        <Target className="h-4 w-4" /> Practise weak area
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stat strip */}
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { icon: ListChecks, label: "Questions attempted", value: questionsAttempted },
                { icon: Sparkles, label: "Average score", value: attempted ? average : "—" },
                { icon: Trophy, label: "Best score", value: attempted ? bestEver : "—" },
                { icon: Flame, label: "Rounds completed", value: attempted },
              ].map((s) => (
                <Card key={s.label} className="border-border/70">
                  <CardContent className="p-5">
                    <s.icon className="text-primary h-4 w-4" />
                    <div className="mt-3 text-2xl font-bold tabular-nums">{s.value}</div>
                    <div className="text-muted-foreground text-xs">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Card className="border-border/70">
                <CardContent className="p-6">
                  <h2 className="text-sm font-semibold">Score over time</h2>
                  {trend.length ? (
                    <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full">
                      <LineChart data={trend} margin={{ left: -20, right: 8, top: 8 }}>
                        <CartesianGrid vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="attempt" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--color-score)"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-muted-foreground mt-4 text-sm">
                      Complete a round to see your progress curve.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardContent className="p-6">
                  <h2 className="text-sm font-semibold">Round-wise performance</h2>
                  <ChartContainer config={chartConfig} className="mt-4 h-[220px] w-full">
                    <BarChart data={byRound} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeOpacity={0.2} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" fill="var(--color-score)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            {/* Achievements */}
            <Card className="border-border/70 mt-4">
              <CardContent className="p-6">
                <h2 className="text-sm font-semibold">Achievements</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {achievements.map((a) => (
                    <span
                      key={a.label}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                        a.unlocked
                          ? "border-primary/50 bg-primary/10 text-foreground"
                          : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      {a.unlocked ? "🏆" : "🔒"} {a.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Rounds */}
        <h2 className="mt-12 text-2xl font-bold">All rounds</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {ROUNDS.map((r) => {
            const best = bestFor(r.round);
            return (
              <Card
                key={r.round}
                className="glow-panel border-border/70 transition-transform hover:-translate-y-0.5"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-primary text-sm font-semibold">Round {r.round}</div>
                      <h3 className="mt-1 text-xl font-semibold">{r.name.split("— ")[1]}</h3>
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

        <h2 className="mt-14 text-2xl font-bold">Recent attempts</h2>
        <div className="mt-4 space-y-3">
          {done.length === 0 && (
            <p className="text-muted-foreground text-sm">No completed rounds yet.</p>
          )}
          {done.slice(0, 8).map((s) => (
            <Link key={s.id} to="/results/$id" params={{ id: s.id }} className="block">
              <Card className="border-border/70 hover:border-primary/60 transition-colors">
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
