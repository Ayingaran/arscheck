import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const createVisitorSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  ticket_type: z.enum(["General", "VIP", "Member"]),
  tour_id: z.string().uuid(),
});

function generateTicketCode() {
  const random = Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();

  const time = Date.now()
    .toString()
    .slice(-6);

  return `ARS-${time}-${random}`;
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request);

    if (!auth.allowed) {
      return NextResponse.json(
        {
          error: auth.error,
        },
        {
          status: auth.status,
        }
      );
    }

    const input = createVisitorSchema.parse(
      await request.json()
    );

    const db = getSupabaseAdmin();

    const ticketCode = generateTicketCode();

    const { data, error } = await db
      .from("visitors")
      .insert({
        ticket_code: ticketCode,
        full_name: input.full_name.trim(),
        email: input.email.trim(),
        ticket_type: input.ticket_type,
        tour_id: input.tour_id,
        checked_in: false,
        checked_in_at: null,
      })
      .select("*, tour:tours(*, exhibitions(*))")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        visitor: data,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid visitor information.",
          details: error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to register visitor.",
      },
      {
        status: 500,
      }
    );
  }
}