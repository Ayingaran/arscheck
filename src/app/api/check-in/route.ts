import { NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffOrAdmin } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const schema = z.object({
  ticket_code: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const auth = await requireStaffOrAdmin(request);

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

    const input = schema.parse(
      await request.json()
    );

    const db = getSupabaseAdmin();

    const { data: visitor, error } = await db
      .from("visitors")
      .select("*, tour:tours(*, exhibitions(*))")
      .eq("ticket_code", input.ticket_code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!visitor) {
      return NextResponse.json(
        {
          error: "Ticket not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (visitor.checked_in) {
      return NextResponse.json(
        {
          error: `Already checked in: ${visitor.full_name}.`,
          visitor,
        },
        {
          status: 409,
        }
      );
    }

    const tourStart = new Date(
      visitor.tour.start_time
    ).getTime();

    const nowMs = Date.now();

    const windowOpen =
      tourStart - 30 * 60_000;

    const windowClose =
      tourStart + 2 * 60 * 60_000;

    if (
      nowMs < windowOpen ||
      nowMs > windowClose
    ) {
      return NextResponse.json(
        {
          error: `Wrong tour timeslot for ${visitor.full_name}.`,
          visitor,
        },
        {
          status: 422,
        }
      );
    }

    const now = new Date().toISOString();

    const { data: updated, error: updateError } =
      await db
        .from("visitors")
        .update({
          checked_in: true,
          checked_in_at: now,
        })
        .eq("id", visitor.id)
        .select("*, tour:tours(*, exhibitions(*))")
        .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      visitor: updated,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid ticket code.",
          details: error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Check-in service unavailable.",
      },
      {
        status: 500,
      }
    );
  }
}