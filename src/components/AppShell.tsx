import { Link, useNavigate } from "@tanstack/react-router";
import { GraduationCap, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, type ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  // Auth state only exists in the browser; render the signed-out nav until
  // hydration finishes so SSR markup and the first client render match.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const signedIn = hydrated && !!session;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="accent-surface flex h-8 w-8 items-center justify-center rounded-lg">
              <GraduationCap className="h-4 w-4 text-primary-foreground" />
            </span>
            PrepRounds
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {signedIn ? (
              <>
                <Link to="/syllabus">
                  <Button variant="ghost" size="sm">
                    Syllabus
                  </Button>
                </Link>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    navigate({ to: "/" });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign in</Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
