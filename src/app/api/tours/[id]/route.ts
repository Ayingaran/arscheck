import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const updateTourSchema = z
  .object({
    title: z.string().min(2).optional(),
    tour_guide: z.string().min(2).optional(),
    start_time: z.string().datetime().optional(),
    max_capacity: z.number().int().min(1).optional(),
    exhibition_id: z.string().uuid().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.tour_guide !== undefined ||
      data.start_time !== undefined ||
      data.max_capacity !== undefined ||
      data.exhibition_id !== undefined,
    {
      message: "No tour fields were provided.",
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

    const input = updateTourSchema.parse(
      await request.json()
    );

    const db = getSupabaseAdmin();

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) {
      updateData.title = input.title.trim();
    }

    if (input.tour_guide !== undefined) {
      updateData.tour_guide = input.tour_guide.trim();
    }

    if (input.start_time !== undefined) {
      updateData.start_time = input.start_time;
    }

    if (input.max_capacity !== undefined) {
      updateData.max_capacity = input.max_capacity;
    }

    if (input.exhibition_id !== undefined) {
      updateData.exhibition_id = input.exhibition_id;
    }

    const { data, error } = await db
      .from("tours")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      tour: data,
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid tour information.",
          details: error.flatten(),
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to update tour.",
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
      .from("tours")
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
        error: "Unable to delete tour.",
      },
      {
        status: 500,
      }
    );
  }
}