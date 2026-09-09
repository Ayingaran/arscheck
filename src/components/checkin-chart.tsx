"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { Visitor } from "@/lib/types";

type Props = {
  visitors: Visitor[];
};

export function CheckinChart({ visitors }: Props) {
  const checkedInVisitors = visitors.filter(
    (visitor) =>
      visitor.checked_in &&
      visitor.checked_in_at
  );

  const grouped = checkedInVisitors.reduce<
    Record<string, number>
  >((acc, visitor) => {
    if (!visitor.checked_in_at) {
      return acc;
    }

    const date = new Date(
      visitor.checked_in_at
    );

    const hour = date.getHours();

    const label = new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "numeric",
      }
    ).format(date);

    acc[label] = (acc[label] ?? 0) + 1;

    return acc;
  }, {});

  const chartData = Object.entries(grouped)
    .map(([time, checkins]) => ({
      time,
      checkins,
    }))
    .sort((a, b) => {
      const aHour = new Date(
        `1970-01-01 ${a.time}`
      ).getHours();

      const bHour = new Date(
        `1970-01-01 ${b.time}`
      ).getHours();

      return aHour - bHour;
    });

  if (chartData.length === 0) {
    return (
      <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60">
        <div className="text-center">
          <div className="text-sm font-medium text-zinc-700">
            No check-in data yet
          </div>

          <div className="mt-1 text-xs text-zinc-400">
            Check-ins will appear here automatically.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: -20,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="checkinGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor="currentColor"
                stopOpacity={0.22}
              />

              <stop
                offset="95%"
                stopColor="currentColor"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e4e4e7"
          />

          <XAxis
            dataKey="time"
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#71717a",
            }}
          />

          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{
              fontSize: 11,
              fill: "#71717a",
            }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              background: "#ffffff",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
            formatter={(value) => [
              value,
              "Check-ins",
            ]}
          />

          <Area
            type="monotone"
            dataKey="checkins"
            stroke="currentColor"
            strokeWidth={2}
            fill="url(#checkinGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}