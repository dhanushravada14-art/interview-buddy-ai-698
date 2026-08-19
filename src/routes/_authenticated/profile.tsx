import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { withRetry } from "@/lib/retry";
import { getProfile, saveProfile } from "@/lib/interview.functions";

const title = "Your student profile — PrepRounds";
const description =
  "Add your degree, target role, skills and projects so every mock interview question is generated around you.";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const persist = useServerFn(saveProfile);

  const [form, setForm] = useState({
    full_name: "",
    college: "",
    degree: "",
    graduation_year: "",
    target_role: "",
    projects: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth" });
  }, [loading, session, navigate]);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile({}),
    enabled: !!session,
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      full_name: data.full_name ?? "",
      college: data.college ?? "",
      degree: data.degree ?? "",
      graduation_year: data.graduation_year ?? "",
      target_role: data.target_role ?? "",
      projects: data.projects ?? "",
    });
    setSkills(data.skills ?? []);
  }, [data]);

  const save = useMutation({
    mutationFn: () => withRetry(() => persist({ data: { ...form, skills } })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved — your questions will adapt to this.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function addSkill() {
    const v = skillInput.trim();
    if (!v || skills.includes(v)) return;
    setSkills([...skills, v]);
    setSkillInput("");
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold">Your profile</h1>
        <p className="text-muted-foreground mt-2">
          The interviewer reads this before every round. The more specific your skills and projects,
          the more realistic your questions.
        </p>

        <Card className="glow-panel mt-8 border-border/70">
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Full name"
                value={form.full_name}
                onChange={(v) => setForm({ ...form, full_name: v })}
              />
              <Field
                label="College"
                value={form.college}
                onChange={(v) => setForm({ ...form, college: v })}
              />
              <Field
                label="Degree / branch"
                value={form.degree}
                onChange={(v) => setForm({ ...form, degree: v })}
              />
              <Field
                label="Graduation year"
                value={form.graduation_year}
                onChange={(v) => setForm({ ...form, graduation_year: v })}
              />
            </div>

            <Field
              label="Target role"
              placeholder="e.g. Software Engineer, Data Analyst"
              value={form.target_role}
              onChange={(v) => setForm({ ...form, target_role: v })}
            />

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  placeholder="React, Python, SQL…"
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {skills.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setSkills(skills.filter((x) => x !== s))}
                  >
                    {s} ×
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projects">Projects</Label>
              <Textarea
                id="projects"
                rows={7}
                placeholder="Describe 1–3 projects: what you built, the stack, your role and the hardest problem you solved."
                value={form.projects}
                onChange={(e) => setForm({ ...form, projects: e.target.value })}
              />
            </div>

            <Button disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving…" : "Save profile"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
