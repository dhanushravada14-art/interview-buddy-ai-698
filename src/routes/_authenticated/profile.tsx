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
import { withRetry } from "@/lib/retry";
import { supabase } from "@/integrations/supabase/client";
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

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile({}),
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

        <PasswordCard />
      </main>
    </AppShell>
  );
}

function PasswordCard() {
  const [providers, setProviders] = useState<string[]>([]);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
      const list = (data.user?.identities ?? []).map((i) => i.provider);
      setProviders(list);
    });
  }, []);

  const hasEmailLogin = providers.includes("email");

  async function setPassword() {
    if (pw.length < 6) {
      toast.error("Use at least 6 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPw("");
    toast.success(`Password set. You can now sign in with ${email} and this password.`);
  }

  return (
    <Card className="mt-8 border-border/70">
      <CardContent className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">
            {hasEmailLogin ? "Change your password" : "Add an email password"}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {hasEmailLogin
              ? `Update the password used to sign in with ${email}.`
              : `You signed up with Google, so ${email} has no password yet. Set one here to also sign in with email and password — it stays the same account.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="password"
            autoComplete="new-password"
            placeholder="New password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
          <Button variant="secondary" disabled={busy} onClick={setPassword}>
            {busy ? "Saving…" : hasEmailLogin ? "Update password" : "Set password"}
          </Button>
        </div>
      </CardContent>
    </Card>
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
