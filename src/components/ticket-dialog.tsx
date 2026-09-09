"use client";

import { QRCodeSVG } from "qrcode.react";
import { Printer, Ticket, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Visitor } from "@/lib/types";
import { formatTime } from "@/lib/utils";

type Props = {
  visitor: Visitor | null;
  open: boolean;
  onClose: () => void;
};

export function TicketDialog({
  visitor,
  open,
  onClose,
}: Props) {
  if (!open || !visitor) {
    return null;
  }

  function handlePrint() {
    const ticket = document.getElementById("print-ticket");

    if (!ticket) {
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=600,height=800"
    );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ArsCheck Ticket</title>

          <meta charset="UTF-8" />

          <style>
            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              padding: 32px;
              background: #ffffff;
              color: #0f0f11;
              font-family: Arial, Helvetica, sans-serif;
            }

            .ticket-print-wrapper {
              width: 100%;
              max-width: 430px;
              margin: 0 auto;
            }

            #print-ticket {
              border: 1px solid #e4e4e7;
              border-radius: 24px;
              padding: 24px;
              background: #ffffff;
            }

            #print-ticket > div:first-child {
              text-align: center;
            }

            #print-ticket h2 {
              margin: 8px 0 4px;
              font-family: Georgia, "Times New Roman", serif;
              font-size: 26px;
              font-weight: 500;
            }

            #print-ticket svg {
              display: block;
              margin: 24px auto;
            }

            @media print {
              body {
                padding: 0;
              }

              .ticket-print-wrapper {
                max-width: 100%;
              }

              #print-ticket {
                border: none;
                border-radius: 0;
              }
            }
          </style>
        </head>

        <body>
          <div class="ticket-print-wrapper">
            ${ticket.outerHTML}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[2rem] border border-zinc-200 bg-[#F9F8F6] p-6 shadow-2xl">

        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:text-zinc-950"
          aria-label="Close ticket"
        >
          <X className="size-4" />
        </button>

        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-zinc-950 text-white">
            <Ticket className="size-4" />
          </div>

          <div>
            <div className="font-display text-xl">
              ArsCheck Ticket
            </div>

            <div className="text-xs text-zinc-400">
              Exhibition access credential
            </div>
          </div>
        </div>

        <div
          id="print-ticket"
          className="rounded-[1.75rem] border border-zinc-200 bg-white p-6"
        >
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.24em] text-zinc-400">
              ArsCheck
            </div>

            <h2 className="mt-2 font-display text-2xl">
              {visitor.full_name}
            </h2>

            <div className="mt-1 text-xs text-zinc-400">
              {visitor.ticket_code}
            </div>
          </div>

          <div className="my-6 flex justify-center">
            <div className="rounded-3xl border border-zinc-200 bg-white p-4">
              <QRCodeSVG
                value={visitor.ticket_code}
                size={210}
                level="H"
                includeMargin
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-zinc-400">
                Ticket type
              </span>

              <span className="font-medium">
                {visitor.ticket_type}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-zinc-400">
                Tour
              </span>

              <span className="max-w-[220px] text-right font-medium">
                {visitor.tour?.title ?? "Unassigned"}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <span className="text-zinc-400">
                Tour time
              </span>

              <span className="font-medium">
                {visitor.tour?.start_time
                  ? formatTime(visitor.tour.start_time)
                  : "—"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400">
                Status
              </span>

              <span
                className={`font-medium ${
                  visitor.checked_in
                    ? "text-emerald-700"
                    : "text-zinc-700"
                }`}
              >
                {visitor.checked_in
                  ? "Checked-in"
                  : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Close
          </Button>

          <Button
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="size-4" />
            Print ticket
          </Button>
        </div>
      </div>
    </div>
  );
}