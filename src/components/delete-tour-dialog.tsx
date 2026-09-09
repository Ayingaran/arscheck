"use client";

import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import type { Tour } from "@/lib/types";

type Props = {
  tour: Tour | null;
  open: boolean;
  onClose: () => void;
  onDeleted: (tourId: string) => void;
};

export function DeleteTourDialog({
  tour,
  open,
  onClose,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!open || !tour) {
    return null;
  }

  async function handleDelete() {
    if (!tour) return;

    try {
      setLoading(true);

      const response = await authFetch(`/api/tours/${tour.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not delete tour.");
        return;
      }

      onDeleted(tour.id);

      toast.success(`${tour.title} deleted`);

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete tour.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[2rem] border border-zinc-200 bg-[#F9F8F6] p-6 shadow-2xl">

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-red-50 text-red-700">
            <Trash2 className="size-4" />
          </div>

          <div>
            <div className="font-display text-xl">
              Delete tour
            </div>

            <div className="text-xs text-zinc-400">
              This action cannot be undone.
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
          <div className="text-sm font-medium text-zinc-900">
            {tour.title}
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Guide: {tour.tour_guide}
          </div>

          <div className="mt-1 text-xs text-zinc-500">
            Capacity: {tour.max_capacity}
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-zinc-500">
          This will permanently remove this tour from ArsCheck.
          Any visitors assigned to this tour may need to be reassigned first.
        </p>

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
            className="flex-1 bg-red-600 text-white hover:bg-red-700"
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className="size-4" />
            {loading ? "Deleting..." : "Delete tour"}
          </Button>
        </div>
      </div>
    </div>
  );
}