"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Task } from "@/lib/scenario/types";

export function AfterActionCharts({ tasks }: { tasks: Task[] }) {
  const byDept = Object.values(
    tasks.reduce<Record<string, { department: string; generated: number; completed: number }>>((acc, t) => {
      acc[t.department] ??= { department: t.department, generated: 0, completed: 0 };
      acc[t.department].generated += 1;
      if (t.status === "completed") acc[t.department].completed += 1;
      return acc;
    }, {}),
  );

  const summary = byDept.map((d) => `${d.department}: ${d.completed}/${d.generated}`).join(", ");

  return (
    <div className="h-64 min-w-0 w-full" role="img" aria-label={`Department execution chart — ${summary}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={byDept} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis dataKey="department" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.03)" }}
            contentStyle={{
              background: "#0a1422",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              fontSize: 11,
            }}
          />
          <Bar dataKey="generated" fill="#334155" name="Generated" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#34d399" name="Completed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
