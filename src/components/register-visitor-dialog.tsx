"use client";

import { useMemo, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tour, Visitor } from "@/lib/types";

type Props = {
  open: boolean;
  tours: Tour[];
  onClose: () => void;
  onCreated: (visitor: Visitor) => void;
};

export function RegisterVisitorDialog({
  open,
  tours,
  onClose,
  onCreated,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketType, setTicketType] = useState<"General" | "VIP" | "Member">("General");
  const [tourId, setTourId] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedTour = useMemo(
    () => tours.find((tour) => tour.id === tourId),
    [tourId, tours]
  );

  if (!open) {
    return null;
  }

  async function handleSubmit() {
    if (!fullName.trim()) {
      toast.error("Visitor name is required.");
      return;
    }

    if (!email.trim()) {
      toast.error("Email is required.");
      return;
    }

    if (!tourId) {
      toast.error("Please select a tour.");
      return;
    }

    try {
      setLoading(true);

      const response = await authFetch("/api/visitors", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          ticket_type: ticketType,
          tour_id: tourId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not register visitor.");
        return;
      }

      onCreated(data.visitor);

      toast.success(`${data.visitor.full_name} registered`);

      setFullName("");
      setEmail("");
      setTicketType("General");
      setTourId("");

      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Could not register visitor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-zinc-200 bg-[#F9F8F6] p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-950"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white">
            <UserPlus className="size-4" />
          </div>

          <div>
            <div className="font-display text-xl">
              Register guest
            </div>

            <div className="text-xs text-zinc-400">
              Create a visitor ticket and assign a tour.
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Full name
            </label>

            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ayingaran Arumugavel"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Email
            </label>

            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="guest@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Ticket type
            </label>

            <select
              value={ticketType}
              onChange={(e) =>
                setTicketType(
                  e.target.value as "General" | "VIP" | "Member"
                )
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="General">General</option>
              <option value="VIP">VIP</option>
              <option value="Member">Member</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Tour
            </label>

            <select
              value={tourId}
              onChange={(e) => setTourId(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">Select tour</option>

              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.title}
                </option>
              ))}
            </select>
          </div>

          {selectedTour && (
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs text-zinc-500">
              Assigned guide:{" "}
              <span className="font-medium text-zinc-800">
                {selectedTour.tour_guide}
              </span>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={loading}
          >
            <UserPlus className="size-4" />
            {loading ? "Registering..." : "Register guest"}
          </Button>
        </div>
      </div>
    </div>
  );
}