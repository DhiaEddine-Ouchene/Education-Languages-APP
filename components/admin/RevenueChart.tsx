"use client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function RevenueChart({ data }: { data: { day: string; amount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" fontSize={11} interval={4} />
        <YAxis fontSize={11} />
        <Tooltip formatter={(v) => [`$${v}`, "Revenue"]} />
        <Line type="monotone" dataKey="amount" stroke="#7F77DD" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
