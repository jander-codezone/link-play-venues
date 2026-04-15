import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { CreditCard, TrendingUp, TrendingDown, Euro, PieChartIcon } from "lucide-react";
import { formatNumberWithDots } from "@/lib/formatNumber";

const COLORS = ["hsl(258, 90%, 66%)", "hsl(25, 95%, 53%)", "hsl(150, 60%, 45%)", "hsl(200, 70%, 50%)", "hsl(340, 70%, 55%)"];

export default function Facturacion() {
  const { data: contrataciones } = useQuery({
    queryKey: ["contrataciones-facturacion"],
    queryFn: async () => {
      const { data } = await supabase
        .from("contrataciones")
        .select("*, artistas(nombre, estilo)");
      return data || [];
    },
  });

  const { data: eventos } = useQuery({
    queryKey: ["eventos-facturacion"],
    queryFn: async () => {
      const { data } = await supabase
        .from("eventos")
        .select("*, artistas(nombre, cache)");
      return data || [];
    },
  });

  // Gastos por mes (últimos 6 meses)
  const gastosPorMes = Array.from({ length: 6 }, (_, i) => {
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

  // Gastos potenciales vs confirmados por mes (últimos 6 meses)
  const gastosPotencialesVsConfirmados = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const eventosDelMes = eventos?.filter((e) => {
      if (!e.fecha) return false;
      const fecha = new Date(e.fecha);
      return fecha >= monthStart && fecha <= monthEnd;
    }) || [];

    const gastoPotencial = eventosDelMes.reduce(
      (sum, e) => sum + (Number(e.artistas?.cache) || 0),
      0
    );

    const gastoConfirmado = eventosDelMes
      .filter((e) => e.artista_confirmado)
      .reduce((sum, e) => sum + (Number(e.artistas?.cache) || 0), 0);

    return {
      mes: format(date, "MMM", { locale: es }),
      potencial: gastoPotencial,
      confirmado: gastoConfirmado,
    };
  });

  // Gastos por estilo
  const gastosPorEstilo = contrataciones?.reduce(
    (acc, c) => {
      const estilo = c.artistas?.estilo || "Sin estilo";
      acc[estilo] = (acc[estilo] || 0) + (Number(c.cache_pagado) || 0);
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(gastosPorEstilo || {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const totalGasto = contrataciones?.reduce(
    (sum, c) => sum + (Number(c.cache_pagado) || 0),
    0
  ) || 0;

  const contratacionesLength = contrataciones?.length || 0;
  const promedioContratacion = contratacionesLength > 0
    ? totalGasto / contratacionesLength
    : 0;

  const mesActual = gastosPorMes[5]?.gasto || 0;
  const mesAnterior = gastosPorMes[4]?.gasto || 0;
  const variacion = mesAnterior > 0 ? ((mesActual - mesAnterior) / mesAnterior) * 100 : 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Facturación</h1>
        <p className="text-muted-foreground">Análisis de gastos y previsiones</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gasto Total</p>
                <p className="mt-1 text-3xl font-bold font-display text-primary">
                  {formatNumberWithDots(totalGasto.toString())}€
                </p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3">
                <Euro className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Este Mes</p>
                <p className="mt-1 text-3xl font-bold font-display">
                  {formatNumberWithDots(mesActual.toString())}€
                </p>
              </div>
              <div className={`rounded-2xl p-3 ${variacion >= 0 ? "bg-red-500/10" : "bg-green-500/10"}`}>
                {variacion >= 0 ? (
                  <TrendingUp className="h-6 w-6 text-red-500" />
                ) : (
                  <TrendingDown className="h-6 w-6 text-green-500" />
                )}
              </div>
            </div>
            <p className={`mt-2 text-sm ${variacion >= 0 ? "text-red-500" : "text-green-500"}`}>
              {variacion >= 0 ? "+" : ""}{variacion.toFixed(1)}% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Promedio</p>
                <p className="mt-1 text-3xl font-bold font-display">
                  {formatNumberWithDots(Math.round(promedioContratacion).toString())}€
                </p>
              </div>
              <div className="rounded-2xl bg-accent/10 p-3">
                <PieChartIcon className="h-6 w-6 text-accent" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">por contratación</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contrataciones</p>
                <p className="mt-1 text-3xl font-bold font-display">
                  {contratacionesLength}
                </p>
              </div>
              <div className="rounded-2xl bg-green-500/10 p-3">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">total realizadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Potencial vs Confirmado Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Gastos Potenciales vs Confirmados
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Comparativa entre eventos agendados y confirmaciones reales
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gastosPotencialesVsConfirmados}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                <YAxis 
                  className="text-xs fill-muted-foreground" 
                  tickFormatter={(value) => `€${value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}`}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${formatNumberWithDots(value.toString())}€`,
                    name === "potencial" ? "Potencial" : "Confirmado",
                  ]}
                  contentStyle={{
                    backgroundColor: "hsl(240, 21%, 13%)",
                    border: "1px solid hsl(240, 21%, 20%)",
                    borderRadius: "12px",
                  }}
                />
                <Legend 
                  formatter={(value) => value === "potencial" ? "Gasto Potencial" : "Gasto Confirmado"}
                />
                <Line
                  type="monotone"
                  dataKey="potencial"
                  stroke="hsl(258, 90%, 66%)"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ fill: "hsl(258, 90%, 66%)", strokeWidth: 2, r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="confirmado"
                  stroke="hsl(150, 60%, 45%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(150, 60%, 45%)", strokeWidth: 2, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Area Chart */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolución de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gastosPorMes}>
                  <defs>
                    <linearGradient id="colorGastoArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(258, 90%, 66%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [`${formatNumberWithDots(value.toString())}€`, "Gasto"]}
                    contentStyle={{
                      backgroundColor: "hsl(240, 21%, 13%)",
                      border: "1px solid hsl(240, 21%, 20%)",
                      borderRadius: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="gasto"
                    stroke="hsl(258, 90%, 66%)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGastoArea)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-accent" />
              Gastos Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gastosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip
                    formatter={(value: number) => [`${formatNumberWithDots(value.toString())}€`, "Gasto"]}
                    contentStyle={{
                      backgroundColor: "hsl(240, 21%, 13%)",
                      border: "1px solid hsl(240, 21%, 20%)",
                      borderRadius: "12px",
                    }}
                  />
                  <Bar dataKey="gasto" fill="hsl(25, 95%, 53%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pie Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <PieChartIcon className="h-5 w-5 text-primary" />
            Distribución por Estilo Musical
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="h-[300px] w-full lg:w-1/2">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${formatNumberWithDots(value.toString())}€`, "Gasto"]}
                      contentStyle={{
                        backgroundColor: "hsl(240, 21%, 13%)",
                        border: "1px solid hsl(240, 21%, 20%)",
                        borderRadius: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Sin datos
                </div>
              )}
            </div>
            {pieData.length > 0 && (
              <div className="flex-1 space-y-3">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{formatNumberWithDots(item.value.toString())}€</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
