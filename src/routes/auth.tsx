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
  const [setPwMode, setSetPwMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    if (loading || !session) return;
    const pending = sessionStorage.getItem("preprounds:pending-password");
    if (pending) {
      sessionStorage.removeItem("preprounds:pending-password");
      void supabase.auth.updateUser({ password: pending }).then(({ error }) => {
        if (error) toast.error(`Signed in, but password not set: ${error.message}`);
        else toast.success("Password set — you can now sign in with email and password.");
        navigate({ to: "/dashboard" });
      });
      return;
    }
    navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);


  async function signIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("not confirmed")) {
        toast.error("This email isn't confirmed yet. Use \"Continue with Google\" with the same email, or create the account again.");
      } else if (msg.includes("invalid login credentials")) {
        toast.error(
          'Wrong email or password. If this email was created with "Continue with Google", it has no password yet — sign in with Google once, then set a password on your Profile page.',
          { duration: 8000 },
        );
      } else {
        toast.error(error.message);
      }
      return;
    }
    navigate({ to: "/dashboard" });
  }

  async function signUp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || password.length < 6) {
      toast.error("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    // Password hashing, salting and storage are handled server-side by the
    // backend auth service — never hash or store credentials in app code.
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setBusy(false);

    // Equivalent of the "user already exists" check.
    const alreadyRegistered =
      error?.message.toLowerCase().includes("already registered") ||
      (data?.user && data.user.identities && data.user.identities.length === 0);
    if (alreadyRegistered) {
      toast.error("Email already registered — sign in instead, or use Continue with Google.");
      return;
    }
    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (signInError) {
        toast.error(signInError.message);
        return;
      }
    }
    toast.success("Account created successfully.");
    navigate({ to: "/profile" });
  }


  async function google() {
    if (setPwMode) {
      if (newPassword.length < 6) {
        toast.error("Choose a password of at least 6 characters first.");
        return;
      }
      sessionStorage.setItem("preprounds:pending-password", newPassword);
    }
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

                <div className="rounded-lg border border-border/70 p-4">
                  {setPwMode ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="newpw">New password</Label>
                        <Input
                          id="newpw"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                        />
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Continue with Google below and this password will be set on your account, so
                        next time you can sign in with email and password.
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          setSetPwMode(false);
                          setNewPassword("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-muted-foreground text-xs">
                        Signed up with Google and have no password yet?
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => setSetPwMode(true)}
                      >
                        Set a password
                      </Button>
                    </div>
                  )}
                </div>
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
              {setPwMode ? "Continue with Google & set password" : "Continue with Google"}
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
