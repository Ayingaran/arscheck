"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Camera,
  Check,
  CheckCircle2,
  CircleAlert,
  Mic2,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Visitor } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";

export function Scanner({
  visitors,
  onVisitorChanged,
}: {
  visitors: Visitor[];
  onVisitorChanged: (v: Visitor) => void;
}) {
  const [manual, setManual] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    visitor?: Visitor;
  } | null>(null);
  const scanLockedRef = useRef(false);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   let mounted = true;
  //   async function boot() {
  //     try {
  //       const { Html5Qrcode } = await import("html5-qrcode");
  //       if (!mounted || !containerRef.current) return;
  //       const scanner = new Html5Qrcode("arscheck-reader");
  //       scannerRef.current = scanner;
  //       await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, (decoded: string) => handleScan(decoded), () => undefined);
  //       if (mounted) setCameraReady(true);
  //     } catch {
  //       if (mounted) setCameraReady(false);
  //     }
  //   }
  //   boot();
  //   return () => { mounted = false; scannerRef.current?.stop?.().catch?.(() => undefined); scannerRef.current?.clear?.(); };
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  // useEffect(() => {
  //   let mounted = true;
  //   let scanner: any = null;

  //   async function boot() {
  //     try {
  //       const { Html5Qrcode } = await import("html5-qrcode");

  //       if (!mounted || !containerRef.current) return;

  //       scanner = new Html5Qrcode("arscheck-reader");
  //       scannerRef.current = scanner;

  //       await scanner.start(
  //         { facingMode: "environment" },
  //         {
  //           fps: 10,
  //           qrbox: { width: 250, height: 250 },
  //         },
  //         (decoded: string) => {
  //           if (scanLockedRef.current) return;

  //           scanLockedRef.current = true;

  //           handleScan(decoded);

  //           setTimeout(() => {
  //             scanLockedRef.current = false;
  //           }, 4000);
  //         }
  //       );

  //       if (mounted) {
  //         setCameraReady(true);
  //       }
  //     } catch (error) {
  //       console.error("QR scanner failed to start:", error);

  //       if (mounted) {
  //         setCameraReady(false);
  //       }
  //     }
  //   }

  //   boot();

  //   return () => {
  //     mounted = false;

  //     const currentScanner = scannerRef.current;

  //     if (!currentScanner) return;

  //     scannerRef.current = null;

  //     // Stop the camera first, then clear the scanner DOM.
  //     currentScanner
  //       .stop()
  //       .catch(() => {
  //         // Scanner may already be stopped/unmounted.
  //       })
  //       .finally(() => {
  //         try {
  //           currentScanner.clear();
  //         } catch {
  //           // Ignore cleanup errors during React unmount.
  //         }
  //       });
  //   };

  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    let disposed = false;
    let started = false;
    let scanner: any = null;

    async function stopScanner() {
      if (!scanner || !started) {
        return;
      }

      // Prevent a second stop attempt.
      started = false;

      try {
        await scanner.stop();
      } catch (error) {
        console.warn("Scanner stop skipped:", error);
      }

      try {
        scanner.clear();
      } catch (error) {
        console.warn("Scanner clear skipped:", error);
      }
    }

    async function boot() {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (disposed || !containerRef.current) {
          return;
        }

        scanner = new Html5Qrcode("arscheck-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          (decoded: string) => {
            // Ignore new scans while one ticket
            // is already being processed.
            if (scanLockedRef.current) {
              return;
            }

            scanLockedRef.current = true;

            handleScan(decoded);

            setTimeout(() => {
              scanLockedRef.current = false;
            }, 3000);
          },
          () => {
            // Normal scan misses happen constantly,
            // so we intentionally ignore them.
          },
        );

        started = true;

        // User may have switched to Admin while
        // the camera was still starting.
        if (disposed) {
          await stopScanner();
          return;
        }

        setCameraReady(true);
      } catch (error) {
        console.error("QR scanner failed to start:", error);

        if (!disposed) {
          setCameraReady(false);
        }
      }
    }

    boot();

    return () => {
      disposed = true;
      setCameraReady(false);

      // Run cleanup without throwing into React.
      void stopScanner().finally(() => {
        if (scannerRef.current === scanner) {
          scannerRef.current = null;
        }
      });
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function feedback(kind: "success" | "error") {
    try {
      const AudioContextCtor =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextCtor();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.frequency.value = kind === "success" ? 660 : 180;
      gain.gain.value = 0.025;
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + (kind === "success" ? 0.07 : 0.12));
    } catch {
      /* audio permission may be unavailable */
    }
  }

  async function handleScan(ticketCode: string) {
    if (busy) return;
    setBusy(true);
    const response = await authFetch("/api/check-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticket_code: ticketCode }),
    });
    const payload = await response.json();
    if (response.ok) {
      setResult({
        ok: true,
        message: "Entry verified",
        visitor: payload.visitor,
      });
      onVisitorChanged(payload.visitor);
      feedback("success");
      navigator.vibrate?.(70);
      toast.success("Ticket verified");
    } else {
      setResult({ ok: false, message: payload.error ?? "Invalid ticket" });
      feedback("error");
      navigator.vibrate?.([60, 50, 60]);
      toast.error(payload.error ?? "Invalid ticket");
    }
    setManual("");
    setBusy(false);
  }

  const manualMatches =
    manual.trim().length > 1
      ? visitors
          .filter(
            (v) =>
              v.full_name.toLowerCase().includes(manual.toLowerCase()) ||
              v.ticket_code.toLowerCase().includes(manual.toLowerCase()),
          )
          .slice(0, 4)
      : [];

  async function actionForResult(action: "audio" | "vip" | "undo") {
    const visitor = result?.visitor;
    if (!visitor) return;
    if (action === "undo") {
      const res = await fetch(`/api/visitors/${visitor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ checked_in: false }),
      });
      if (res.ok) {
        const body = await res.json();
        onVisitorChanged(body.visitor);
        setResult(null);
        toast.message("Check-in undone");
      }
      return;
    }
    toast.message(
      action === "audio"
        ? "Audio guide assignment queued"
        : "VIP flag noted for this session",
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <Card className="overflow-hidden bg-zinc-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Front desk scanner</div>
            <div className="text-xs text-zinc-400">
              Point the camera at a visitor QR code.
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-300">
            <span
              className={`size-2 rounded-full ${cameraReady ? "bg-emerald-400" : "bg-amber-300"}`}
            />
            {cameraReady ? "Camera ready" : "Camera unavailable"}
          </div>
        </div>
        <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-900 to-zinc-800">
          <div
            id="arscheck-reader"
            ref={containerRef}
            className="absolute inset-0 overflow-hidden [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
          />
          <div className="pointer-events-none absolute inset-10 rounded-[2rem] border border-white/20">
            <div className="absolute inset-0 m-12 rounded-[1.5rem] border border-[#D4AF37]/70" />
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/8" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/8" />
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-4 py-2 text-xs text-zinc-200 backdrop-blur">
            Center the code inside the frame
          </div>
          {!cameraReady && (
            <div className="absolute inset-0 grid place-items-center bg-zinc-950/70 p-8 text-center backdrop-blur-sm">
              <div>
                <Camera className="mx-auto size-8 text-zinc-500" />
                <div className="mt-3 text-sm">
                  Camera preview is unavailable in this browser or environment.
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  Use manual ticket lookup below.
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="grid gap-3 border-t border-white/10 p-5 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-zinc-500" />
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && manual) {
                  const match = manualMatches[0];
                  handleScan(match?.ticket_code ?? manual);
                }
              }}
              className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-zinc-600"
              placeholder="Enter ticket ID or visitor name"
            />
            {manualMatches.length > 0 && (
              <div className="absolute left-0 right-0 top-12 z-10 rounded-2xl border border-white/10 bg-zinc-900 p-2 shadow-2xl">
                {manualMatches.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleScan(v.ticket_code)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-white/5"
                  >
                    <span className="text-sm">{v.full_name}</span>
                    <span className="text-[10px] text-zinc-500">
                      {v.ticket_code}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="gold"
            disabled={!manual || busy}
            onClick={() => {
              const match = manualMatches[0];
              handleScan(match?.ticket_code ?? manual);
            }}
          >
            Verify ticket
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-zinc-200 bg-white/80 p-8 editorial-shadow"
            >
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-zinc-100">
                <ShieldCheck className="size-7 text-zinc-600" />
              </div>
              <div className="mt-5 text-center">
                <div className="font-semibold">Awaiting next ticket</div>
                <div className="mt-1 text-sm text-zinc-500">
                  Verified entries appear here instantly.
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={result.ok ? "ok" : "bad"}
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`rounded-3xl border p-6 editorial-shadow ${result.ok ? "border-emerald-200 bg-emerald-50/80" : "border-red-200 bg-red-50/80"}`}
            >
              <div className="flex items-center gap-3">
                {result.ok ? (
                  <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500 text-white">
                    <CheckCircle2 className="size-6" />
                  </div>
                ) : (
                  <div className="grid size-12 place-items-center rounded-2xl bg-red-500 text-white">
                    <CircleAlert className="size-6" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-semibold">
                    {result.ok
                      ? "SUCCESS · Entry approved"
                      : "INVALID · Attention required"}
                  </div>
                  <div className="text-xs text-zinc-500">{result.message}</div>
                </div>
              </div>
              {result.visitor && (
                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-white/80 bg-white/70 p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-full bg-zinc-100">
                        <UserRound className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold">
                          {result.visitor.full_name}
                        </div>
                        <div className="text-xs text-zinc-500">
                          {result.visitor.email}
                        </div>
                      </div>
                      <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                        {result.visitor.ticket_type}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-zinc-400">Tour group</div>
                        <div className="mt-1 font-medium">
                          {result.visitor.tour?.title}
                        </div>
                      </div>
                      <div>
                        <div className="text-zinc-400">Checked in</div>
                        <div className="mt-1 font-medium">
                          {formatTime(
                            result.visitor.checked_in_at ??
                              new Date().toISOString(),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actionForResult("audio")}
                    >
                      <Mic2 className="size-4" />
                      Audio guide
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => actionForResult("vip")}
                    >
                      <Check className="size-4" />
                      Mark VIP
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => actionForResult("undo")}
                    >
                      <RotateCcw className="size-4" />
                      Undo
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="rounded-3xl border border-zinc-200 bg-white/65 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CircleAlert className="size-4 text-zinc-400" /> Front-desk rules
          </div>
          <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-500">
            <div>• Ticket codes are unique and one-time use.</div>
            <div>
              • Wrong tour window or prior check-in returns a clear exception.
            </div>
            <div>
              • Realtime keeps the dashboard synchronized for all operators.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
