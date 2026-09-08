import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, GraduationCap, LogOut, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState, type ReactNode } from "react";

type NavLink = { label: string; to: string };
type NavGroup = { label: string; items: NavLink[] };

const NAV: (NavLink | NavGroup)[] = [
  { label: "Dashboard", to: "/dashboard" },
  {
    label: "Prepare",
    items: [
      { label: "Roadmap", to: "/roadmap" },
      { label: "Aptitude", to: "/interview/aptitude" },
      { label: "DSA & Coding", to: "/dsa" },
      { label: "SQL Lab", to: "/sql" },
      { label: "Core CS", to: "/core-cs" },
      { label: "Syllabus", to: "/syllabus" },
    ],
  },
  {
    label: "Portfolio",
    items: [
      { label: "Resume", to: "/resume" },
      { label: "Projects", to: "/projects" },
      { label: "Companies", to: "/companies" },
    ],
  },
  { label: "Mock Interview", to: "/mock" },
  { label: "Progress", to: "/progress" },
  { label: "AI Coach", to: "/coach" },
];

function isGroup(n: NavLink | NavGroup): n is NavGroup {
  return "items" in n;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  // Auth state only exists in the browser; render the signed-out nav until
  // hydration finishes so SSR markup and the first client render match.
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setHydrated(true), []);
  const signedIn = hydrated && !!session;

  async function signOut() {
    setOpen(false);
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

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

          {signedIn ? (
            <>
              <nav className="hidden items-center gap-0.5 text-sm lg:flex">
                {NAV.map((n) =>
                  isGroup(n) ? (
                    <DropdownMenu key={n.label}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {n.label} <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {n.items.map((i) => (
                          <DropdownMenuItem key={i.to} asChild>
                            <Link to={i.to}>{i.label}</Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Link key={n.to} to={n.to} activeProps={{ className: "text-primary" }}>
                      <Button variant="ghost" size="sm">
                        {n.label}
                      </Button>
                    </Link>
                  ),
                )}
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    Profile
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </nav>

              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72 overflow-y-auto">
                  <SheetTitle className="text-base">Menu</SheetTitle>
                  <div className="mt-4 flex flex-col gap-1 text-sm">
                    {NAV.map((n) =>
                      isGroup(n) ? (
                        <div key={n.label} className="mt-3">
                          <div className="text-muted-foreground px-2 text-xs font-semibold uppercase tracking-wide">
                            {n.label}
                          </div>
                          {n.items.map((i) => (
                            <Link
                              key={i.to}
                              to={i.to}
                              onClick={() => setOpen(false)}
                              className="hover:bg-accent block rounded-md px-2 py-2"
                            >
                              {i.label}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <Link
                          key={n.to}
                          to={n.to}
                          onClick={() => setOpen(false)}
                          className="hover:bg-accent block rounded-md px-2 py-2 font-medium"
                        >
                          {n.label}
                        </Link>
                      ),
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="hover:bg-accent mt-3 block rounded-md px-2 py-2 font-medium"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={signOut}
                      className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-2 text-left"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <nav className="flex items-center gap-1 text-sm">
              <Link to="/syllabus">
                <Button variant="ghost" size="sm">
                  Syllabus
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Sign in</Button>
              </Link>
            </nav>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
