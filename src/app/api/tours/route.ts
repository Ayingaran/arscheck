import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-auth";
import { getSupabaseAdmin } from "@/lib/supabase-server";

const createTourSchema = z.object({
  title: z.string().min(2),
  tour_guide: z.string().min(2),
  start_time: z.string().datetime(),
  max_capacity: z.number().int().min(1),
  exhibition_id: z.string().uuid(),
});

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

    const input = createTourSchema.parse(
      await request.json()
    );

    const db = getSupabaseAdmin();

    const { data, error } = await db
      .from("tours")
      .insert({
        title: input.title.trim(),
        tour_guide: input.tour_guide.trim(),
        start_time: input.start_time,
        max_capacity: input.max_capacity,
        exhibition_id: input.exhibition_id,
      })
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        tour: data,
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
        error: "Unable to create tour.",
      },
      {
        status: 500,
      }
    );
  }
}