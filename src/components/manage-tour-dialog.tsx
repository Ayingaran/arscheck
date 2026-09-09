"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarPlus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tour } from "@/lib/types";

type ExhibitionOption = {
  id: string;
  title: string;
};

type Props = {
  open: boolean;
  mode: "create" | "edit";
  tour: Tour | null;
  exhibitions: ExhibitionOption[];
  onClose: () => void;
  onSaved: (tour: Tour) => void;
};

export function ManageTourDialog({
  open,
  mode,
  tour,
  exhibitions,
  onClose,
  onSaved,
}: Props) {
  const [title, setTitle] = useState("");
  const [tourGuide, setTourGuide] = useState("");
  const [startTime, setStartTime] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("20");
  const [exhibitionId, setExhibitionId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && tour) {
      setTitle(tour.title);
      setTourGuide(tour.tour_guide);
      setMaxCapacity(String(tour.max_capacity));
      setExhibitionId(tour.exhibition_id);

      const date = new Date(tour.start_time);

      const localValue = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000
      )
        .toISOString()
        .slice(0, 16);

      setStartTime(localValue);
    } else {
      setTitle("");
      setTourGuide("");
      setStartTime("");
      setMaxCapacity("20");
      setExhibitionId(exhibitions[0]?.id ?? "");
    }
  }, [open, mode, tour, exhibitions]);

  const heading = useMemo(
    () => (mode === "create" ? "Create tour" : "Edit tour"),
    [mode]
  );

  async function handleSave() {
    if (!title.trim()) {
      toast.error("Tour title must be at least 2 characters.");
      return;
    }

    if (!tourGuide.trim()) {
      toast.error("Tour guide must be at least 2 characters.");
      return;
    }

    if (!startTime) {
      toast.error("Start time is required.");
      return;
    }

    if (!exhibitionId) {
      toast.error("Please select an exhibition.");
      return;
    }

    const capacity = Number(maxCapacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      toast.error("Capacity must be at least 1.");
      return;
    }

    if (mode === "edit" && !tour) {
      toast.error("No tour selected.");
      return;
    }

    try {
      setLoading(true);

      const endpoint =
        mode === "create"
          ? "/api/tours"
          : `/api/tours/${tour!.id}`;

      const method =
        mode === "create" ? "POST" : "PATCH";

      const response = await authFetch(endpoint, {
        method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          tour_guide: tourGuide.trim(),
          start_time: new Date(startTime).toISOString(),
          max_capacity: capacity,
          exhibition_id: exhibitionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not save tour.");
        return;
      }

      onSaved(data.tour);

      toast.success(
        mode === "create"
          ? `${data.tour.title} created`
          : `${data.tour.title} updated`
      );

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Could not save tour.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-zinc-200 bg-[#F9F8F6] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
          aria-label="Close tour dialog"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white">
            {mode === "create" ? (
              <CalendarPlus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
          </div>

          <div>
            <div className="font-display text-xl">
              {heading}
            </div>

            <div className="text-xs text-zinc-400">
              Manage exhibition tour scheduling and capacity.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Tour title
            </label>

            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Impressionism Gallery"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Tour guide
            </label>

            <Input
              value={tourGuide}
              onChange={(event) => setTourGuide(event.target.value)}
              placeholder="Maya Chen"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Start time
            </label>

            <Input
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Maximum capacity
            </label>

            <Input
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(event) => setMaxCapacity(event.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Exhibition
            </label>

            <select
              value={exhibitionId}
              onChange={(event) =>
                setExhibitionId(event.target.value)
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="">Select exhibition</option>

              {exhibitions.map((exhibition) => (
                <option
                  key={exhibition.id}
                  value={exhibition.id}
                >
                  {exhibition.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            {mode === "create" ? (
              <CalendarPlus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}

            {loading
              ? "Saving..."
              : mode === "create"
                ? "Create tour"
                : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}