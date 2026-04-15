import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useGastosMensuales } from "@/hooks/useContrataciones";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { formatNumberWithDots } from "@/lib/formatNumber";

export function GastosChart() {
  const { data: contrataciones } = useGastosMensuales();

  const chartData = React.useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const gastoMes = contrataciones
        ?.filter((c) => {
          if (!c.fecha) return false;
          const fecha = new Date(c.fecha);
          return fecha >= monthStart && fecha <= monthEnd;
        })
        .reduce((sum, c) => sum + (Number(c.cache_pagado) || 0), 0);

      return {
        mes: format(date, "MMM", { locale: es }),
        gasto: gastoMes || 0,
      };
    });
  }, [contrataciones]);

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-base font-display">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Evolución de Gastos</p>
            <p className="text-xs text-muted-foreground font-normal">
              Inversión mensual en artistas
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGasto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(42, 100%, 63%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(42, 100%, 63%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="mes"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(value: number) => [`${formatNumberWithDots(value.toString())} €`, "Gasto"]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px hsl(0 0% 0% / 0.1)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="gasto"
                stroke="hsl(42, 100%, 63%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorGasto)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
