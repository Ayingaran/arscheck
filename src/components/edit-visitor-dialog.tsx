"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/auth-fetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Tour, Visitor } from "@/lib/types";

type Props = {
  visitor: Visitor | null;
  tours: Tour[];
  open: boolean;
  onClose: () => void;
  onUpdated: (visitor: Visitor) => void;
};

type TicketType = "General" | "VIP" | "Member";

export function EditVisitorDialog({
  visitor,
  tours,
  open,
  onClose,
  onUpdated,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketType, setTicketType] = useState<TicketType>("General");
  const [tourId, setTourId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visitor) {
      return;
    }

    setFullName(visitor.full_name);
    setEmail(visitor.email);
    setTicketType(visitor.ticket_type as TicketType);
    setTourId(visitor.tour_id ?? "");
  }, [visitor]);

  if (!open || !visitor) {
    return null;
  }

  async function handleSave() {
  if (!visitor) {
    toast.error("No visitor selected.");
    return;
  }

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

    const response = await authFetch(
      `/api/visitors/${visitor.id}`,
      {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          ticket_type: ticketType,
          tour_id: tourId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      toast.error(
        data.error ?? "Could not update visitor."
      );
      return;
    }

    onUpdated(data.visitor);

    toast.success(
      `${data.visitor.full_name} updated`
    );

    onClose();
  } catch (error) {
    console.error(error);
    toast.error("Could not update visitor.");
  } finally {
    setLoading(false);
  }
}
//   async function handleSave() {
//     if (!fullName.trim()) {
//       toast.error("Visitor name is required.");
//       return;
//     }

//     if (!email.trim()) {
//       toast.error("Email is required.");
//       return;
//     }

//     if (!tourId) {
//       toast.error("Please select a tour.");
//       return;
//     }

//     try {
//       setLoading(true);

//       const response = await fetch(`/api/visitors/${visitor.id}`, {
//         method: "PATCH",
//         headers: {
//           "content-type": "application/json",
//         },
//         body: JSON.stringify({
//           full_name: fullName.trim(),
//           email: email.trim(),
//           ticket_type: ticketType,
//           tour_id: tourId,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         toast.error(data.error ?? "Could not update visitor.");
//         return;
//       }

//       onUpdated(data.visitor);

//       toast.success(`${data.visitor.full_name} updated`);

//       onClose();
//     } catch (error) {
//       console.error(error);
//       toast.error("Could not update visitor.");
//     } finally {
//       setLoading(false);
//     }
//   }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[2rem] border border-zinc-200 bg-[#F9F8F6] p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
          aria-label="Close edit visitor"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white">
            <Pencil className="size-4" />
          </div>

          <div>
            <div className="font-display text-xl">
              Edit visitor
            </div>

            <div className="text-xs text-zinc-400">
              Update guest details and tour assignment.
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
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Visitor name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Email
            </label>

            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="guest@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">
              Ticket type
            </label>

            <select
              value={ticketType}
              onChange={(event) =>
                setTicketType(event.target.value as TicketType)
              }
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
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
              onChange={(event) => setTourId(event.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-zinc-400"
            >
              <option value="">Select tour</option>

              {tours.map((tour) => (
                <option key={tour.id} value={tour.id}>
                  {tour.title}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-400">
              Ticket code
            </div>

            <div className="mt-1 text-sm font-medium text-zinc-800">
              {visitor.ticket_code}
            </div>

            <div className="mt-1 text-xs text-zinc-400">
              Ticket codes are kept unchanged when editing a visitor.
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="flex-1"
            onClick={handleSave}
            disabled={loading}
          >
            <Pencil className="size-4" />
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}