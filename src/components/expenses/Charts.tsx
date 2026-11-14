import { useId } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCompact, formatMoney } from "@/lib/expenses/format";

interface TipEntry {
  name?: string | number;
  value?: number | string | Array<number | string>;
  color?: string;
  payload?: { fill?: string; color?: string };
}

interface TipProps {
  active?: boolean;
  payload?: TipEntry[];
  label?: string | number;
  currency: string;
  labelFormat?: ((label: string | number) => string) | undefined;
}

function ChartTip({ active, payload, label, currency, labelFormat }: TipProps) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value !== null && p.value !== undefined);
  if (!rows.length) return null;
  return (
    <div className="min-w-36 rounded-xl border bg-popover px-3 py-2 text-xs shadow-card">
      {label !== undefined && label !== "" && (
        <p className="mb-1.5 font-semibold text-popover-foreground">{labelFormat ? labelFormat(label) : label}</p>
      )}
      {rows.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5 text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color ?? p.payload?.color ?? p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold tabular-nums text-popover-foreground">
            {formatMoney(Number(p.value), currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

const axisTick = { fill: "var(--muted-foreground)", fontSize: 11 };
const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "");

export function CumulativeChart({
  data,
  currency,
  currentLabel = "This month",
  previousLabel = "Last month",
  height = 260,
}: {
  data: { day: number; current: number | null; previous: number | null }[];
  currency: string;
  currentLabel?: string;
  previousLabel?: string;
  height?: number;
}) {
  const gid = safeId(useId());
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id={`cur-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={48} />
        <Tooltip content={<ChartTip currency={currency} labelFormat={(l) => `Day ${l}`} />} cursor={{ stroke: "var(--border)" }} />
        <Area
          type="monotone"
          dataKey="previous"
          name={previousLabel}
          stroke="var(--chart-10)"
          strokeWidth={2}
          strokeDasharray="5 4"
          fill="transparent"
          dot={false}
          activeDot={{ r: 3 }}
        />
        <Area
          type="monotone"
          dataKey="current"
          name={currentLabel}
          stroke="var(--chart-1)"
          strokeWidth={2.5}
          fill={`url(#cur-${gid})`}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DailyBarChart({
  data,
  currency,
  highlight,
  height = 240,
  labelFormat,
}: {
  data: { label: string; total: number; date: string }[];
  currency: string;
  highlight?: string | undefined;
  height?: number;
  labelFormat?: ((label: string | number) => string) | undefined;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={10} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={48} />
        <Tooltip content={<ChartTip currency={currency} labelFormat={labelFormat} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="total" name="Spent" radius={[6, 6, 2, 2]} maxBarSize={28}>
          {data.map((d) => (
            <Cell key={d.date} fill={d.date === highlight ? "var(--chart-1)" : "var(--chart-2)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
  currency,
  total,
  height = 220,
}: {
  data: { name: string; value: number; color: string }[];
  currency: string;
  total: number;
  height?: number;
}) {
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<ChartTip currency={currency} />} />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="66%"
            outerRadius="94%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            cornerRadius={4}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium text-muted-foreground">Total</span>
        <span className="text-base font-bold tabular-nums text-foreground">{formatMoney(total, currency)}</span>
      </div>
    </div>
  );
}

export function MonthlyBarChart({
  data,
  currency,
  activeKey,
  height = 240,
}: {
  data: { key: string; label: string; total: number }[];
  currency: string;
  activeKey?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={false} interval={0} minTickGap={0} fontSize={10} />
        <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v: number) => formatCompact(v)} width={48} />
        <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="total" name="Spent" radius={[6, 6, 2, 2]} maxBarSize={36}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.key === activeKey ? "var(--chart-1)" : "var(--chart-6)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
