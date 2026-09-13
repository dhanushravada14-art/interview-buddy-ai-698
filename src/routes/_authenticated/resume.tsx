import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { FileText, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { getProfile, saveProfile } from "@/lib/interview.functions";
import { parseResume, type ParsedResumeData } from "@/lib/resume.functions";

const title = "Resume upload & AI review — PrepRounds";
const description =
  "Upload your resume, let the AI read it and auto-fill your placement profile with skills, projects, internships and achievements.";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: ResumePage,
});

async function extractText(file: File): Promise<string> {
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let out = "";
    for (let p = 1; p <= doc.numPages; p += 1) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      out += `${content.items.map((i) => ("str" in i ? i.str : "")).join(" ")}\n`;
    }
    return out.trim();
  }
  return (await file.text()).trim();
}

function ResumePage() {
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getProfile);
  const runParse = useServerFn(parseResume);
  const persist = useServerFn(saveProfile);
  const fileRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState("");
  const [filename, setFilename] = useState("");
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null);
  const [reading, setReading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchProfile({}),
  });

  const parse = useMutation({
    mutationFn: () => runParse({ data: { filename, text } }),
    onSuccess: (r) => {
      setParsed(r);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Resume read. Review the details, then apply them to your profile.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!parsed) return;
      await persist({
        data: {
          full_name: parsed.full_name || profile?.full_name || "",
          college: parsed.college || profile?.college || "",
          degree: parsed.degree || profile?.degree || "",
          branch: parsed.branch || profile?.branch || "",
          graduation_year: parsed.graduation_year || profile?.graduation_year || "",
          cgpa: parsed.cgpa || profile?.cgpa || "",
          target_role: parsed.target_role || profile?.target_role || "",
          skills: parsed.skills.length ? parsed.skills.slice(0, 40) : (profile?.skills ?? []),
          projects: parsed.projects || profile?.projects || "",
          internships: parsed.internships || profile?.internships || "",
          certifications: parsed.certifications || profile?.certifications || "",
          achievements: parsed.achievements || profile?.achievements || "",
          target_companies: profile?.target_companies ?? [],
          skill_levels: (profile?.skill_levels as Record<string, number>) ?? {},
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated from your resume.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    try {
      const t = await extractText(file);
      if (t.length < 80) {
        toast.error("Couldn't read enough text from that file. Paste your resume text instead.");
      } else {
        setFilename(file.name);
        setText(t);
        toast.success(`Loaded ${file.name}`);
      }
    } catch {
      toast.error("That file couldn't be read. Try a PDF or paste the text below.");
    } finally {
      setReading(false);
    }
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-4xl px-4 py-10">
        <PageHeader
          eyebrow="Portfolio"
          title="Resume upload & AI review"
          description="The AI reads your resume once and fills in your profile, so every mock interview question is built from your real projects and skills."
        />

        {isLoading ? (
          <Skeleton className="mt-8 h-48" />
        ) : (
          <>
            {profile?.resume_filename && (
              <p className="text-muted-foreground mt-6 text-sm">
                <FileText className="mr-1 inline h-4 w-4" />
                Last uploaded: {profile.resume_filename}
              </p>
            )}

            <Card className="border-border/70 mt-6">
              <CardContent className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.txt,.md"
                    className="hidden"
                    onChange={(e) => onFile(e.target.files?.[0])}
                  />
                  <Button
                    variant="secondary"
                    disabled={reading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> {reading ? "Reading…" : "Choose PDF or text file"}
                  </Button>
                  <span className="text-muted-foreground text-xs">
                    PDF, .txt or .md — or paste the text below.
                  </span>
                </div>

                <Textarea
                  rows={12}
                  placeholder="Paste your resume text here…"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />

                <Button
                  disabled={parse.isPending || text.trim().length < 80}
                  onClick={() => parse.mutate()}
                >
                  <Sparkles className="h-4 w-4" />
                  {parse.isPending ? "Reading your resume…" : "Analyse resume"}
                </Button>
                {text.trim().length > 0 && text.trim().length < 80 && (
                  <p className="text-destructive text-xs">
                    That is too short — paste the full resume text.
                  </p>
                )}
              </CardContent>
            </Card>

            {parse.isPending && <Skeleton className="mt-4 h-64" />}

            {parsed && (
              <Card className="border-primary/40 bg-primary/5 mt-4">
                <CardContent className="space-y-5 p-6">
                  <div>
                    <h2 className="text-lg font-semibold">What the AI found</h2>
                    <p className="mt-2 text-sm">{parsed.summary}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Detail label="Name" value={parsed.full_name} />
                    <Detail label="College" value={parsed.college} />
                    <Detail label="Branch" value={parsed.branch || parsed.degree} />
                    <Detail label="Graduation year" value={parsed.graduation_year} />
                    <Detail label="CGPA" value={parsed.cgpa} />
                    <Detail label="Target role" value={parsed.target_role} />
                  </div>

                  {parsed.skills.length > 0 && (
                    <div>
                      <div className="text-muted-foreground text-xs font-semibold uppercase">
                        Skills
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {parsed.skills.map((s) => (
                          <Badge key={s} variant="secondary">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Detail label="Projects" value={parsed.projects} block />
                  <Detail label="Internships" value={parsed.internships} block />
                  <Detail label="Certifications" value={parsed.certifications} block />
                  <Detail label="Achievements" value={parsed.achievements} block />

                  {parsed.suggestions.length > 0 && (
                    <div>
                      <div className="text-muted-foreground text-xs font-semibold uppercase">
                        Resume improvements
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {parsed.suggestions.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-1">
                    <Button disabled={apply.isPending} onClick={() => apply.mutate()}>
                      {apply.isPending ? "Applying…" : "Apply to my profile"}
                    </Button>
                    <Link to="/roadmap">
                      <Button variant="secondary">Build my roadmap</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

function Detail({ label, value, block }: { label: string; value: string; block?: boolean }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-muted-foreground text-xs font-semibold uppercase">{label}</div>
      <p className={block ? "mt-1 whitespace-pre-wrap text-sm" : "mt-1 text-sm font-medium"}>
        {value}
      </p>
    </div>
  );
}
