import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";

interface ChartDataPoint {
  t: string;
  value: number;
}

interface TimeSeriesChartProps {
  data: ChartDataPoint[];
  metric: "fees" | "volume";
}

export function TimeSeriesChart({ data, metric }: TimeSeriesChartProps) {
  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatXAxis = (value: string) => {
    try {
      const date = new Date(value);
      return format(date, "hh:mmaaa").toLowerCase();
    } catch {
      return value;
    }
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FFE224" stopOpacity={0.32} />
            <stop offset="95%" stopColor="#FFE224" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 4% 18%)" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={formatXAxis}
          stroke="hsl(0 0% 60%)"
          tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
          stroke="hsl(0 0% 60%)"
          tick={{ fill: "hsl(0 0% 60%)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          label={{ value: "USD", angle: -90, position: "insideLeft", fill: "hsl(0 0% 60%)", fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(240 5% 11%)",
            border: "1px solid hsl(240 4% 16%)",
            borderRadius: "6px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "hsl(0 0% 60%)", marginBottom: "4px", fontSize: "12px" }}
          itemStyle={{ color: "hsl(0 0% 95%)", fontSize: "14px", fontWeight: "600" }}
          formatter={(value: number) => [formatValue(value), metric === "fees" ? "Fees" : "Volume"]}
          labelFormatter={(label) => {
            try {
              return format(new Date(label), "MMM dd, yyyy hh:mm aaa");
            } catch {
              return label;
            }
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#FFE224"
          strokeWidth={2}
          fill="url(#colorValue)"
          dot={false}
          activeDot={{ r: 4, fill: "#FFE224" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
