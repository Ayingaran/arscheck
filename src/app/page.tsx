"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanLine,
  Sparkles,
  UserRound,
  Wifi,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Dashboard } from "@/components/dashboard";
import { Scanner } from "@/components/scanner";
import { Button } from "@/components/ui/button";
import type { DashboardStats, Tour, Visitor } from "@/lib/types";
import { supabase } from "@/lib/supabase-browser";
import { LogOut } from "lucide-react";
import { LoginScreen } from "@/components/login-screen";
import type { User } from "@supabase/supabase-js";
import { authFetch } from "@/lib/auth-fetch";

type Exhibition = {
  id: string;
  title: string;
};

const demoVisitors: Visitor[] = [
  {
    id: "demo-1",
    ticket_code: "ARS-0001",
    full_name: "Amelia Hart",
    email: "amelia@example.com",
    ticket_type: "VIP",
    tour_id: "tour-1",
    checked_in: true,
    checked_in_at: null,
    tour: {
      id: "tour-1",
      exhibition_id: "ex-1",
      title: "Impressionism Gallery",
      tour_guide: "Maya Chen",
      start_time: "2026-09-09T10:00:00.000Z",
      max_capacity: 24,
    },
  },
  {
    id: "demo-2",
    ticket_code: "ARS-0002",
    full_name: "Daniel Perera",
    email: "daniel@example.com",
    ticket_type: "General",
    tour_id: "tour-1",
    checked_in: true,
    checked_in_at: null,
    tour: {
      id: "tour-1",
      exhibition_id: "ex-1",
      title: "Impressionism Gallery",
      tour_guide: "Maya Chen",
      start_time: "2026-09-09T10:00:00.000Z",
      max_capacity: 24,
    },
  },
  {
    id: "demo-3",
    ticket_code: "ARS-0003",
    full_name: "Sofia Malik",
    email: "sofia@example.com",
    ticket_type: "Member",
    tour_id: "tour-2",
    checked_in: false,
    checked_in_at: null,
    tour: {
      id: "tour-2",
      exhibition_id: "ex-1",
      title: "Modern Sculptures",
      tour_guide: "Noah Silva",
      start_time: "2026-09-09T14:00:00.000Z",
      max_capacity: 18,
    },
  },
  {
    id: "demo-4",
    ticket_code: "ARS-0004",
    full_name: "Liam Fernando",
    email: "liam@example.com",
    ticket_type: "General",
    tour_id: "tour-2",
    checked_in: false,
    checked_in_at: null,
    tour: {
      id: "tour-2",
      exhibition_id: "ex-1",
      title: "Modern Sculptures",
      tour_guide: "Noah Silva",
      start_time: "2026-09-09T14:00:00.000Z",
      max_capacity: 18,
    },
  },
];

const demoTours: Tour[] = [demoVisitors[0].tour!, demoVisitors[2].tour!];

export default function Home() {
  const [mode, setMode] = useState<"admin" | "scanner">("admin");

  const [visitors, setVisitors] = useState<Visitor[]>(demoVisitors);

  const [tours, setTours] = useState<Tour[]>(demoTours);

  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);

  const [user, setUser] = useState<User | null>(null);

  const [authLoading, setAuthLoading] = useState(true);

  // const [role, setRole] = useState<"admin" | "staff">("staff");
  const [role, setRole] = useState<"admin" | "staff" | "unauthorized">(
    "unauthorized",
  );
  const [stats, setStats] = useState<DashboardStats>({
    totalAttendees: 128,
    checkedIn: 74,
    activeTours: 4,
    peakTime: "10:18 AM",
  });

  const [connected, setConnected] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const response = await authFetch("/api/dashboard-stats", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
      }

      if (Array.isArray(data.visitors)) {
        setVisitors(data.visitors);
      }

      if (Array.isArray(data.tours)) {
        setTours(data.tours);
      }
      if (Array.isArray(data.exhibitions)) {
        setExhibitions(data.exhibitions);
      }
    } catch (error) {
      console.error("Dashboard data load failed:", error);
    }
  }, []);

  async function handleLogout() {
    const client = supabase;

    if (!client) return;

    await client.auth.signOut();

    setUser(null);
    setMode("admin");
  }

 useEffect(() => {
  const client = supabase;

  if (!client) {
    console.error("Supabase client is not available.");
    setAuthLoading(false);
    return;
  }

  const authClient = client;

  async function loadSession() {
    try {
      const {
        data: { session },
        error,
      } = await authClient.auth.getSession();

      if (error) {
        console.error("Session error:", error);
        setUser(null);
        setRole("unauthorized");
        return;
      }

      setUser(session?.user ?? null);

      const userRole = session?.user?.app_metadata?.role;

      if (userRole === "admin") {
        setRole("admin");
      } else if (userRole === "staff") {
        setRole("staff");
      } else {
        setRole("unauthorized");
      }
    } catch (error) {
      console.error("Failed to load auth session:", error);

      setUser(null);
      setRole("unauthorized");
    } finally {
      setAuthLoading(false);
    }
  }

  void loadSession();

  const {
    data: { subscription },
  } = authClient.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);

    const userRole = session?.user?.app_metadata?.role;

    if (userRole === "admin") {
      setRole("admin");
    } else if (userRole === "staff") {
      setRole("staff");
    } else {
      setRole("unauthorized");
    }

    setAuthLoading(false);
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);

  useEffect(() => {
    if (role === "staff") {
      setMode("scanner");
    }
  }, [role]);

  useEffect(() => {
    if (!user) {
      return;
    }

    if (role === "admin") {
      void loadData();
    }
  }, [user, role, loadData]);

  useEffect(() => {
    const client = supabase;

    if (!client || !user) {
      setConnected(false);
      return;
    }

    const channel = client
      .channel("arscheck-live")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "visitors",
        },
        () => {
          // Dashboard data is admin-only.
          if (role === "admin") {
            void loadData();
          }
        },
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      void client.removeChannel(channel);
    };
  }, [user, role, loadData]);

  const replaceVisitor = useCallback(
    (incoming: Visitor) => {
      setVisitors((current) => {
        const index = current.findIndex(
          (visitor) => visitor.id === incoming.id,
        );

        if (index === -1) {
          return [incoming, ...current];
        }

        const next = [...current];
        next[index] = incoming;

        return next;
      });

      void loadData();
    },
    [loadData],
  );

  const headerLabel = useMemo(
    () => (mode === "admin" ? "Operations control" : "Front desk scanner"),
    [mode],
  );

  if (authLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F9F8F6]">
        <div className="text-sm text-zinc-500">Loading ArsCheck...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLoggedIn={() => {
          // auth listener will update user automatically
        }}
      />
      
    );
  }

  if (role === "unauthorized") {
  return (
    <main className="grid min-h-screen place-items-center bg-[#F9F8F6] px-4">
      <div className="w-full max-w-md rounded-[2rem] border border-zinc-200 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-red-50 text-red-600">
          !
        </div>

        <h1 className="mt-5 font-display text-2xl">
          Access denied
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Your account is authenticated, but it does not have
          permission to access ArsCheck.
        </p>

        <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          {user.email}
        </div>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4" />
          Logout
        </Button>
      </div>
    </main>
  );
}

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-[#f9f8f6]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-zinc-950 text-white shadow-sm">
              <Sparkles className="size-4 text-[#D4AF37]" />
            </div>

            <div className="min-w-0">
              <div className="font-display text-lg leading-none">ArsCheck</div>

              <div className="mt-1 hidden text-[10px] uppercase tracking-[.18em] text-zinc-400 sm:block">
                Exhibition tour operations
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white/70 p-1">
            {role === "admin" && (
              <button
                onClick={() => setMode("admin")}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                  mode === "admin"
                    ? "bg-zinc-950 text-white"
                    : "text-zinc-500 hover:text-zinc-950"
                }`}
              >
                <LayoutDashboard className="size-3.5" />
                Admin
              </button>
            )}
            {/* <button
              onClick={() => setMode("admin")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                mode === "admin"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <LayoutDashboard className="size-3.5" />
              Admin
            </button> */}

            <button
              onClick={() => setMode("scanner")}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition ${
                mode === "scanner"
                  ? "bg-zinc-950 text-white"
                  : "text-zinc-500 hover:text-zinc-950"
              }`}
            >
              <ScanLine className="size-3.5" />
              Scanner
            </button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                Signed in as
              </div>

              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xs font-medium capitalize text-zinc-900">
                  {role}
                </span>

                <span className="text-zinc-300">·</span>

                <span className="max-w-[180px] truncate text-xs text-zinc-500">
                  {user.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white/65 px-3 py-2 text-xs text-zinc-500">
              <span
                className={`size-1.5 rounded-full ${
                  connected ? "bg-emerald-500" : "bg-zinc-300"
                }`}
              />

              <Wifi className="size-3.5" />

              {connected ? "Realtime connected" : "Offline"}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleLogout()}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[.24em] text-zinc-400">
              ArsCheck / Exhibition Operations
            </div>

            <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
              {headerLabel}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              A quiet, precise operating layer for gallery teams — designed for
              the rhythm of exhibition day.
            </p>
          </div>

          {mode === "admin" ? (
            <Button variant="outline" onClick={() => void loadData()}>
              <Wifi className="size-4" />
              Sync now
            </Button>
          ) : (
            <div className="rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-xs text-zinc-500">
              Camera + manual fallback enabled
            </div>
          )}
        </div>

        <motion.div
          key={mode}
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.25,
          }}
        >
          {role === "admin" && mode === "admin" ? (
            <Dashboard
              visitors={visitors}
              tours={tours}
              exhibitions={exhibitions}
              stats={stats}
              onVisitorChanged={replaceVisitor}
              onTourChanged={() => void loadData()}
            />
          ) : (
            <Scanner visitors={visitors} onVisitorChanged={replaceVisitor} />
          )}
          {/* {mode === "admin" ? (
            <Dashboard
              visitors={visitors}
              tours={tours}
              exhibitions={exhibitions}
              stats={stats}
              onVisitorChanged={replaceVisitor}
              onTourChanged={() => void loadData()}
            />
          ) : (
            <Scanner visitors={visitors} onVisitorChanged={replaceVisitor} />
          )} */}
        </motion.div>
      </div>

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 md:px-6">
        <div className="flex flex-col gap-2 border-t border-zinc-200/80 pt-5 text-[11px] text-zinc-400 md:flex-row md:justify-between">
          <span>ArsCheck · exhibition operations prototype</span>

          <span>
            Built for responsive desktop + front-desk tablet workflows
          </span>
        </div>
      </footer>
    </main>
  );
}
