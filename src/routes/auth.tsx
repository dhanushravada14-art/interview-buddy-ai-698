import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";

const title = "Sign in — PrepRounds Mock Interviews";
const description =
  "Create your PrepRounds account to save your student profile, take mock interview rounds and track your marks.";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed")) {
        toast.error("This email isn't confirmed yet. Use \"Continue with Google\" with the same email, or create the account again.");
      } else if (msg.includes("invalid login credentials")) {
        toast.error("Wrong email or password. If you signed up with Google, use \"Continue with Google\".");
      } else {
        toast.error(error.message);
      }
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function signUp() {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("An account already exists for this email. Sign in instead, or use Continue with Google.");
      return;
    }
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        toast.error(signInError.message);
        return;
      }
    }
    toast.success("Account created. You can start your first round.");
    navigate({ to: "/profile" });
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <main className="hero-surface flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
        <Card className="glow-panel w-full max-w-md border-border/70">
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold">Welcome to PrepRounds</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Save your profile, take all four rounds and keep your marks.
            </p>

            <Tabs defaultValue="signin" className="mt-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Create account</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw">Password</Label>
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={signIn}>
                  Sign in
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2">Email</Label>
                  <Input
                    id="email2"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pw2">Password</Label>
                  <Input
                    id="pw2"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button className="w-full" disabled={busy} onClick={signUp}>
                  Create account
                </Button>
              </TabsContent>
            </Tabs>

            <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs">
              <span className="h-px flex-1 bg-border" /> or{" "}
              <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" className="w-full" onClick={google}>
              Continue with Google
            </Button>
            <p className="text-muted-foreground mt-6 text-center text-xs">
              <Link to="/">Back to home</Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </AppShell>
  );
}
