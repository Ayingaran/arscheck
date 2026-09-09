import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const schema = z
  .object({
    checked_in: z.boolean().optional(),
    full_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    ticket_type: z.enum(["General", "VIP", "Member"]).optional(),
    tour_id: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      data.checked_in !== undefined ||
      data.full_name !== undefined ||
      data.email !== undefined ||
      data.ticket_type !== undefined ||
      data.tour_id !== undefined,
    {
      message: "No visitor fields were provided.",
    }
  );

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const input = schema.parse(
      await request.json()
    );

    const db = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};

    if (input.full_name !== undefined) {
      updateData.full_name = input.full_name.trim();
    }

    if (input.email !== undefined) {
      updateData.email = input.email.trim();
    }

    if (input.ticket_type !== undefined) {
      updateData.ticket_type = input.ticket_type;
    }

    if (input.tour_id !== undefined) {
      updateData.tour_id = input.tour_id;
    }

    if (input.checked_in !== undefined) {
      updateData.checked_in = input.checked_in;
      updateData.checked_in_at = input.checked_in
        ? new Date().toISOString()
        : null;
    }

    const { data, error } = await db
      .from("visitors")
      .update(updateData)
      .eq("id", id)
      .select("*, tour:tours(*, exhibitions(*))")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      visitor: data,
    });
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
        error: "Unable to update visitor.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const db = getSupabaseAdmin();

    const { error } = await db
      .from("visitors")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to delete visitor.",
      },
      {
        status: 500,
      }
    );
  }
}