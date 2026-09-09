"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import type { Visitor } from "@/lib/types";

type Props = {
  visitors: Visitor[];
};

export function TicketTypeChart({ visitors }: Props) {
  const counts = visitors.reduce<Record<string, number>>(
    (acc, visitor) => {
      const type = visitor.ticket_type || "Unknown";

      acc[type] = (acc[type] ?? 0) + 1;

      return acc;
    },
    {}
  );

  const data = Object.entries(counts).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  if (data.length === 0) {
    return (
      <div className="grid h-[260px] place-items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/60">
        <div className="text-center">
          <div className="text-sm font-medium text-zinc-700">
            No ticket data yet
          </div>

          <div className="mt-1 text-xs text-zinc-400">
            Ticket distribution will appear here.
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
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={
                  [
                    "#18181b",
                    "#a1a1aa",
                    "#d4af37",
                    "#71717a",
                  ][index % 4]
                }
              />
            ))}
          </Pie>

          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid #e4e4e7",
              background: "#ffffff",
              boxShadow:
                "0 10px 30px rgba(0,0,0,0.08)",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {data.map((item, index) => (
          <div
            key={item.name}
            className="flex items-center gap-2 text-xs text-zinc-500"
          >
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: [
                  "#18181b",
                  "#a1a1aa",
                  "#d4af37",
                  "#71717a",
                ][index % 4],
              }}
            />

            {item.name}: {item.value}
          </div>
        ))}
      </div>
    </div>
  );
}