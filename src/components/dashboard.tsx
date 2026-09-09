"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock3,
  Crown,
  Search,
  Users,
  Waves,
  XCircle,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { DashboardStats, Tour, Visitor } from "@/lib/types";
import { formatRelativeTime, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { RegisterVisitorDialog } from "@/components/register-visitor-dialog";
import { EditVisitorDialog } from "@/components/edit-visitor-dialog";
import { DeleteVisitorDialog } from "@/components/delete-visitor-dialog";
import { ManageTourDialog } from "@/components/manage-tour-dialog";
import { Download, Plus, Pencil, Trash2 } from "lucide-react";
import { DeleteTourDialog } from "@/components/delete-tour-dialog";
import { CheckinChart } from "@/components/checkin-chart";
import { authFetch } from "@/lib/auth-fetch";
import { TicketTypeChart } from "@/components/ticket-type-chart";

import { TicketDialog } from "@/components/ticket-dialog";

const filters = ["All", "Checked-in", "Pending", "VIP"] as const;

type Exhibition = {
  id: string;
  title: string;
};

type Props = {
  visitors: Visitor[];
  tours: Tour[];
  exhibitions: Exhibition[];
  stats: DashboardStats;
  onVisitorChanged: (visitor: Visitor) => void;
  onTourChanged: () => void;
};

export function Dashboard({
  visitors,
  exhibitions,
  tours,
  stats,
  onVisitorChanged,
  onTourChanged,
}: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [mounted, setMounted] = useState(false);

  const [tourDialogOpen, setTourDialogOpen] = useState(false);
  const [tourDialogMode, setTourDialogMode] = useState<"create" | "edit">(
    "create",
  );
  const [editingTour, setEditingTour] = useState<Tour | null>(null);
  const [deletingTour, setDeletingTour] = useState<Tour | null>(null);
  const [deletingVisitor, setDeletingVisitor] = useState<Visitor | null>(null);
  const [editingVisitor, setEditingVisitor] = useState<Visitor | null>(null);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "all">("all");

  function exportVisitorsCsv() {
    const rows = visitors.map((visitor) => ({
      Name: visitor.full_name,
      Email: visitor.email,
      "Ticket Code": visitor.ticket_code,
      "Ticket Type": visitor.ticket_type,
      Tour: visitor.tour?.title ?? "Unassigned",
      Status: visitor.checked_in ? "Checked-in" : "Pending",
      "Checked-in At": visitor.checked_in_at
        ? new Date(visitor.checked_in_at).toLocaleString()
        : "",
    }));

    const headers = Object.keys(rows[0] ?? {});

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header as keyof typeof row] ?? "");

            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `arscheck-visitors-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function exportToursCsv() {
    const rows = tours.map((tour) => {
      const assignedVisitors = visitors.filter(
        (visitor) => visitor.tour_id === tour.id,
      );

      const checkedInCount = assignedVisitors.filter(
        (visitor) => visitor.checked_in,
      ).length;

      return {
        Tour: tour.title,
        Guide: tour.tour_guide,
        "Start Time": new Date(tour.start_time).toLocaleString(),
        Capacity: tour.max_capacity,
        Assigned: assignedVisitors.length,
        "Checked In": checkedInCount,
        Exhibition: tour.exhibitions?.title ?? "Unknown",
      };
    });

    const headers = Object.keys(rows[0] ?? {});

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String(row[header as keyof typeof row] ?? "");

            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `arscheck-tours-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  const visibleVisitors = useMemo(
    () =>
      visitors.filter((v) => {
        const q = query.toLowerCase().trim();
        const matchesQuery =
          !q ||
          v.full_name.toLowerCase().includes(q) ||
          v.ticket_code.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q);
        const status =
          v.ticket_type === "VIP"
            ? "VIP"
            : v.checked_in
              ? "Checked-in"
              : "Pending";
        return matchesQuery && (filter === "All" || status === filter);
      }),
    [visitors, query, filter],
  );

  async function toggleCheckIn(visitor: Visitor) {
    const next = !visitor.checked_in;
    const response = await authFetch(`/api/visitors/${visitor.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ checked_in: next }),
    });
    if (!response.ok) {
      toast.error("Could not update ticket.");
      return;
    }
    const updated = await response.json();
    onVisitorChanged(updated.visitor);
    toast.success(
      next
        ? `${visitor.full_name} checked in`
        : `${visitor.full_name} marked pending`,
    );
  }

  function openCreateTour() {
    setTourDialogMode("create");
    setEditingTour(null);
    setTourDialogOpen(true);
  }

  function openEditTour(tour: Tour) {
    setTourDialogMode("edit");
    setEditingTour(tour);
    setTourDialogOpen(true);
  }

  // async function deleteTour(tour: Tour) {
  //   const confirmed = window.confirm(
  //     `Delete "${tour.title}"? This cannot be undone.`,
  //   );

  //   if (!confirmed) return;

  //   try {
  //     const response = await fetch(`/api/tours/${tour.id}`, {
  //       method: "DELETE",
  //     });

  //     const data = await response.json();

  //     if (!response.ok) {
  //       toast.error(data.error ?? "Could not delete tour.");
  //       return;
  //     }

  //     toast.success(`${tour.title} deleted`);
  //     onTourChanged();
  //   } catch (error) {
  //     console.error(error);
  //     toast.error("Could not delete tour.");
  //   }
  // }
  const filteredVisitors = visitors.filter((visitor) => {
    if (dateFilter === "all") {
      return true;
    }

    const dateValue = visitor.checked_in_at ?? visitor.tour?.start_time;

    if (!dateValue) {
      return false;
    }

    const visitorDate = new Date(dateValue);
    const now = new Date();

    if (dateFilter === "today") {
      return (
        visitorDate.getFullYear() === now.getFullYear() &&
        visitorDate.getMonth() === now.getMonth() &&
        visitorDate.getDate() === now.getDate()
      );
    }

    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    return visitorDate >= weekAgo && visitorDate <= now;
  });

  const sortedTours = [...tours].sort((a, b) => {
    const now = Date.now();

    function getRank(tour: Tour) {
      const start = new Date(tour.start_time).getTime();

      const activeStart = start - 30 * 60_000;
      const activeEnd = start + 2 * 60 * 60_000;

      if (now >= activeStart && now <= activeEnd) {
        return 0;
      }

      if (now < activeStart) {
        return 1;
      }

      return 2;
    }

    const rankA = getRank(a);
    const rankB = getRank(b);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Total attendees"
          value={stats.totalAttendees}
          note="Across all active tours"
          icon={<Users className="size-4" />}
        />
        <Metric
          title="Currently checked-in"
          value={stats.checkedIn}
          note={`${stats.totalAttendees ? Math.round((stats.checkedIn / stats.totalAttendees) * 100) : 0}% of registrations`}
          icon={<UserCheck className="size-4" />}
          accent="emerald"
        />
        <Metric
          title="Active tours"
          value={stats.activeTours}
          note="Running today"
          icon={<Waves className="size-4" />}
        />
        <Metric
          title="Peak check-in"
          value={stats.peakTime}
          note="Highest arrival density"
          icon={<Clock3 className="size-4" />}
          accent="gold"
        />
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-display text-xl">Analytics</div>

          <div className="mt-1 text-xs text-zinc-400">
            Filter dashboard insights by time period
          </div>
        </div>

        <div className="flex rounded-xl border border-zinc-200 bg-white p-1">
          <button
            onClick={() => setDateFilter("today")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              dateFilter === "today"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            Today
          </button>

          <button
            onClick={() => setDateFilter("week")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              dateFilter === "week"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            This Week
          </button>

          <button
            onClick={() => setDateFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              dateFilter === "all"
                ? "bg-zinc-950 text-white"
                : "text-zinc-500 hover:text-zinc-950"
            }`}
          >
            All
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl">Check-in activity</div>

              <div className="mt-1 text-xs text-zinc-400">
                Visitor check-ins grouped by time
              </div>
            </div>

            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Live analytics
            </div>
          </div>

          <CheckinChart visitors={filteredVisitors} />
        </div>

        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl">Ticket distribution</div>

              <div className="mt-1 text-xs text-zinc-400">
                Visitors grouped by ticket type
              </div>
            </div>

            <div className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Audience mix
            </div>
          </div>

          <TicketTypeChart visitors={filteredVisitors} />
        </div>
      </div>
      <section className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-zinc-100">
            <div>
              <CardTitle>Live check-in feed</CardTitle>
              <CardDescription>
                Updates as the front desk scans tickets.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Live
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <AnimatePresence initial={false}>
              {visitors
                .filter((v) => v.checked_in)
                .slice(0, 6)
                .map((v) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    key={v.id}
                    className="flex items-center gap-3 border-b border-zinc-100 px-5 py-4 last:border-b-0"
                  >
                    <div className="grid size-9 place-items-center rounded-full bg-zinc-100 text-xs font-semibold">
                      {v.full_name
                        .split(" ")
                        .map((s) => s[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {v.full_name}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {v.tour?.title ?? "Tour"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium">
                        {mounted ? formatRelativeTime(v.checked_in_at) : "--"}
                      </div>

                      <div className="text-[11px] text-zinc-400">
                        {v.ticket_type}
                      </div>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
            {!visitors.some((v) => v.checked_in) && (
              <div className="px-5 py-12 text-center text-sm text-zinc-400">
                No check-ins yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Tour schedule</CardTitle>
              <CardDescription>Capacity and assigned guide.</CardDescription>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                onClick={exportToursCsv}
                disabled={tours.length === 0}
                className="h-10 whitespace-nowrap px-4"
              >
                <Download className="size-4 shrink-0" />
                <span className="whitespace-nowrap">Export CSV</span>
              </Button>

              <Button
                onClick={openCreateTour}
                className="h-10 whitespace-nowrap px-4"
              >
                <Plus className="size-4 shrink-0" />
                <span className="whitespace-nowrap">New Tour</span>
              </Button>
            </div>
          </CardHeader>
          {/* <CardHeader><CardTitle>Tour schedule</CardTitle><CardDescription>Capacity and assigned guide.</CardDescription></CardHeader> */}
          <CardContent className="space-y-4">
            {sortedTours.map((tour) => {
              const taken = visitors
                .filter((v) => v.tour_id === tour.id)
                .filter((v) => v.checked_in).length;
              const pct = (taken / tour.max_capacity) * 100;
              const startMs = new Date(tour.start_time).getTime();
              const nowMs = Date.now();

              const activeStart = startMs - 30 * 60_000;
              const activeEnd = startMs + 2 * 60 * 60_000;

              let tourStatus: "Upcoming" | "Active" | "Past" = "Upcoming";

              if (nowMs >= activeStart && nowMs <= activeEnd) {
                tourStatus = "Active";
              } else if (nowMs > activeEnd) {
                tourStatus = "Past";
              }
              return (
                <div
                  key={tour.id}
                  className="space-y-2 rounded-2xl border border-zinc-100 p-3"
                >
                  {/* <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm">{tour.title}</div>
                      <div className="text-xs text-zinc-500">
                        {formatTime(tour.start_time)} · {tour.tour_guide}
                      </div>
                    </div>
                    <Badge className="border-zinc-200 bg-zinc-50">
                      {taken}/{tour.max_capacity}
                    </Badge>
                  </div> */}

                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">{tour.title}</div>

                      <div className="text-xs text-zinc-500">
                        {formatTime(tour.start_time)} · {tour.tour_guide}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge className="border-zinc-200 bg-zinc-50">
                        {taken}/{tour.max_capacity}
                      </Badge>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditTour(tour)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingTour(tour)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={pct} />
                  <div className="flex justify-between text-[10px] uppercase tracking-[.14em] text-zinc-400">
                    <span>{Math.round(pct)}% filled</span>
                    <span
                      className={
                        tourStatus === "Active"
                          ? "text-emerald-600"
                          : tourStatus === "Past"
                            ? "text-zinc-400"
                            : "text-amber-600"
                      }
                    >
                      {tourStatus}
                    </span>
                    <div className="flex justify-between text-[10px] uppercase tracking-[.14em] text-zinc-400">
                      <span>{Math.round(pct)}% filled</span>

                      <span
                        className={
                          tourStatus === "Active"
                            ? "text-emerald-600"
                            : tourStatus === "Past"
                              ? "text-zinc-400"
                              : "text-amber-600"
                        }
                      >
                        {tourStatus}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="gap-4 md:flex md:flex-row md:items-end md:justify-between">
          {/* <div><CardTitle>Guest directory</CardTitle><CardDescription>Search registrations and perform manual check-ins.</CardDescription></div> */}

          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Guest directory</CardTitle>
              <CardDescription>
                Search registrations and perform manual check-ins.
              </CardDescription>
            </div>

            <Button onClick={() => setRegisterOpen(true)}>
              Register guest
            </Button>

            <Button
              variant="outline"
              onClick={exportVisitorsCsv}
              disabled={visitors.length === 0}
            >
              <Download className="size-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-zinc-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 sm:w-64"
                placeholder="Search name, email, ticket…"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs transition ${filter === f ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y border-zinc-100 bg-zinc-50/70 text-left text-[10px] uppercase tracking-[.14em] text-zinc-400">
              <tr>
                <th className="px-5 py-3 font-medium">Visitor</th>
                <th className="px-5 py-3 font-medium">Tour</th>
                <th className="px-5 py-3 font-medium">Ticket</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleVisitors.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-4">
                    <div className="font-medium">{v.full_name}</div>
                    <div className="text-xs text-zinc-400">{v.email}</div>
                  </td>
                  <td className="px-5 py-4 text-xs text-zinc-600">
                    {v.tour?.title}
                  </td>
                  <td className="px-5 py-4">
                    <Badge
                      className={
                        v.ticket_type === "VIP"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-zinc-200 bg-zinc-50"
                      }
                    >
                      {v.ticket_type}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    {v.checked_in ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="size-4" />
                        Checked-in
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                        <XCircle className="size-4" />
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedVisitor(v)}
                      >
                        Ticket
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingVisitor(v)}
                      >
                        Edit
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingVisitor(v)}
                      >
                        Delete
                      </Button>

                      <Button
                        size="sm"
                        variant={v.checked_in ? "outline" : "default"}
                        onClick={() => toggleCheckIn(v)}
                      >
                        {v.checked_in ? "Undo" : "Check in"}
                        <ChevronRight className="size-3" />
                      </Button>
                    </div>
                    {/* <div className="flex justify-end gap-2">
    <Button
      size="sm"
      variant="outline"
      onClick={() => setSelectedVisitor(v)}
    >
      Ticket
    </Button>

    <Button
      size="sm"
      variant={v.checked_in ? "outline" : "default"}
      onClick={() => toggleCheckIn(v)}
    >
      {v.checked_in ? "Undo" : "Check in"}
      <ChevronRight className="size-3" />
    </Button>
  </div> */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <TicketDialog
        visitor={selectedVisitor}
        open={!!selectedVisitor}
        onClose={() => setSelectedVisitor(null)}
      />

      <RegisterVisitorDialog
        open={registerOpen}
        tours={tours}
        onClose={() => setRegisterOpen(false)}
        onCreated={(visitor) => {
          onVisitorChanged(visitor);
          setRegisterOpen(false);
        }}
      />
      <EditVisitorDialog
        visitor={editingVisitor}
        tours={tours}
        open={!!editingVisitor}
        onClose={() => setEditingVisitor(null)}
        onUpdated={(visitor) => {
          onVisitorChanged(visitor);
          setEditingVisitor(null);
        }}
      />
      <DeleteVisitorDialog
        visitor={deletingVisitor}
        open={!!deletingVisitor}
        onClose={() => setDeletingVisitor(null)}
        onDeleted={(visitorId) => {
          // For now, Realtime/loadData will refresh the list.
          setDeletingVisitor(null);
        }}
      />
      <DeleteTourDialog
        tour={deletingTour}
        open={!!deletingTour}
        onClose={() => setDeletingTour(null)}
        onDeleted={() => {
          setDeletingTour(null);
          onTourChanged();
        }}
      />
      <ManageTourDialog
        open={tourDialogOpen}
        mode={tourDialogMode}
        tour={editingTour}
        exhibitions={exhibitions}
        onClose={() => {
          setTourDialogOpen(false);
          setEditingTour(null);
        }}
        onSaved={(tour) => {
          setTourDialogOpen(false);
          setEditingTour(null);
          onTourChanged();
        }}
      />
    </div>
  );
}

function Metric({
  title,
  value,
  note,
  icon,
  accent = "default",
}: {
  title: string;
  value: string | number;
  note: string;
  icon: React.ReactNode;
  accent?: "default" | "emerald" | "gold";
}) {
  const iconClass =
    accent === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : accent === "gold"
        ? "bg-amber-50 text-amber-800"
        : "bg-zinc-100 text-zinc-700";
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-3xl border border-zinc-200/80 bg-white/75 p-5 editorial-shadow"
    >
      <div className="flex items-center justify-between">
        <div
          className={`grid size-9 place-items-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
        <span className="text-[10px] uppercase tracking-[.16em] text-zinc-400">
          ArsCheck
        </span>
      </div>
      <div className="mt-6 text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-medium">{title}</div>
      <div className="mt-1 text-xs text-zinc-400">{note}</div>
    </motion.div>
  );
}
