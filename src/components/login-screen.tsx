"use client";

import { useState } from "react";
import { LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-browser";

type Props = {
  onLoggedIn: () => void;
};

export function LoginScreen({
  onLoggedIn,
}: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!password) {
      toast.error("Password is required.");
      return;
    }

    if (!supabase) {
      toast.error("Supabase is not configured.");
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Welcome back.");

      onLoggedIn();
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#F9F8F6] px-4">
      <div className="pointer-events-none absolute left-[-120px] top-[-120px] size-[340px] rounded-full bg-amber-100/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-150px] right-[-100px] size-[380px] rounded-full bg-zinc-200/60 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-zinc-950 text-white shadow-sm">
            <Sparkles className="size-5 text-[#D4AF37]" />
          </div>

          <h1 className="mt-5 font-display text-4xl">
            ArsCheck
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Exhibition operations access
          </p>
        </div>

        <div className="rounded-[2rem] border border-zinc-200/80 bg-white/80 p-7 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="font-display text-2xl">
              Sign in
            </div>

            <p className="mt-1 text-sm text-zinc-500">
              Access the admin dashboard or scanner.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                Email
              </label>

              <Input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="staff@arscheck.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-600">
                Password
              </label>

              <Input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                autoComplete="current-password"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void handleLogin();
                  }
                }}
              />
            </div>
          </div>

          <Button
            className="mt-6 w-full"
            onClick={() => void handleLogin()}
            disabled={loading}
          >
            <LogIn className="size-4" />

            {loading
              ? "Signing in..."
              : "Sign in"}
          </Button>

          <div className="mt-5 border-t border-zinc-100 pt-4 text-center text-xs text-zinc-400">
            Authorized exhibition staff only
          </div>
        </div>
      </div>
    </main>
  );
}