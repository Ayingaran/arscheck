import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: Request) {
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
    const db = getSupabaseAdmin();

    const [
      { data: visitors, error: visitorsError },
      { data: tours, error: toursError },
      { data: exhibitions, error: exhibitionsError },
    ] = await Promise.all([
      db
        .from("visitors")
        .select("*, tour:tours(*, exhibitions(*))")
        .order("checked_in_at", { ascending: false }),

      db
        .from("tours")
        .select("*, exhibitions(*)")
        .order("start_time", { ascending: true }),

      db
        .from("exhibitions")
        .select("id, title")
        .order("start_time", { ascending: true }),
    ]);

    if (visitorsError || toursError || exhibitionsError) {
      throw visitorsError || toursError || exhibitionsError;
    }

    const list = visitors ?? [];

    const checkins = list.filter(
      (visitor) => visitor.checked_in
    );

    const hourCounts = checkins.reduce<Record<string, number>>(
      (acc, visitor) => {
        if (!visitor.checked_in_at) {
          return acc;
        }

        const label = new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(visitor.checked_in_at));

        acc[label] = (acc[label] ?? 0) + 1;

        return acc;
      },
      {}
    );

    const peakTime =
      Object.entries(hourCounts).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] ?? "—";

    const now = Date.now();

    const activeTours = (tours ?? []).filter((tour) => {
      const start = new Date(tour.start_time).getTime();

      return Math.abs(start - now) < 90 * 60_000;
    }).length;

    return NextResponse.json({
      stats: {
        totalAttendees: list.length,
        checkedIn: checkins.length,
        activeTours,
        peakTime,
      },
      visitors: list,
      tours: tours ?? [],
      exhibitions: exhibitions ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Dashboard data unavailable.",
      },
      {
        status: 500,
      }
    );
  }
}