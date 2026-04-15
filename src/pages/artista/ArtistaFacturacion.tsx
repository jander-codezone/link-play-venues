import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Euro, TrendingUp, Clock, CheckCircle, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const invoiceStats = [
  { title: "Facturado este mes", value: "€12,450", icon: Euro, subtitle: "Total facturado" },
  { title: "Pendiente de cobro", value: "€3,200", icon: Clock, subtitle: "Por cobrar" },
  { title: "Cobrado", value: "€9,250", icon: CheckCircle, subtitle: "Este mes" },
  { title: "Crecimiento", value: "+18%", icon: TrendingUp, subtitle: "vs mes anterior" },
];

const recentInvoices = [
  { id: "FAC-001", negocio: "Bar El Rincón", amount: "€450", status: "pagada" },
  { id: "FAC-002", negocio: "Club Nocturno Luna", amount: "€1,200", status: "pendiente" },
  { id: "FAC-003", negocio: "Restaurante Mar", amount: "€350", status: "pagada" },
  { id: "FAC-004", negocio: "Pub The Corner", amount: "€600", status: "vencida" },
];

export default function ArtistaFacturacion() {
  const [facturacionPotencial, setFacturacionPotencial] = useState<number>(0);
  const [eventosCount, setEventosCount] = useState<{ confirmados: number; pendientes: number }>({ confirmados: 0, pendientes: 0 });
  const [historicalData, setHistoricalData] = useState<{ mes: string; facturacion: number }[]>([]);

  useEffect(() => {
    const fetchFacturacionPotencial = async () => {
      const now = new Date();
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      const { data: eventos, error } = await supabase
        .from('eventos')
        .select(`id, artista_confirmado, artista_id, artistas (cache)`)
        .gte('fecha', monthStart)
        .lte('fecha', monthEnd);

      if (!error && eventos) {
        let total = 0;
        let confirmados = 0;
        let pendientes = 0;

        eventos.forEach((evento: any) => {
          const cache = evento.artistas?.cache || 0;
          total += Number(cache);
          if (evento.artista_confirmado) confirmados++;
          else pendientes++;
        });

        setFacturacionPotencial(total);
        setEventosCount({ confirmados, pendientes });
      }
    };

    const fetchHistoricalData = async () => {
      const { data: contrataciones, error } = await supabase
        .from('contrataciones')
        .select('fecha, cache_pagado')
        .not('fecha', 'is', null)
        .order('fecha', { ascending: true });

      if (!error && contrataciones) {
        const monthlyData: { [key: string]: number } = {};
        contrataciones.forEach((c: any) => {
          if (c.fecha) {
            const date = parseISO(c.fecha);
            const monthKey = format(date, 'yyyy-MM');
            if (!monthlyData[monthKey]) monthlyData[monthKey] = 0;
            monthlyData[monthKey] += Number(c.cache_pagado || 0);
          }
        });

        const sortedData = Object.entries(monthlyData)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, value]) => ({
            mes: format(parseISO(`${key}-01`), 'MMM yy', { locale: es }),
            facturacion: value
          }));

        setHistoricalData(sortedData);
      }
    };

    fetchFacturacionPotencial();
    fetchHistoricalData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
        <p className="text-muted-foreground mt-1">Análisis de ingresos y previsiones</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {invoiceStats.map((stat) => (
          <Card key={stat.title} className="border shadow-sm bg-card rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{stat.title}</span>
                <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border shadow-sm bg-card rounded-xl">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Facturación potencial</span>
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-foreground">€{facturacionPotencial.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{eventosCount.confirmados} confirmados · {eventosCount.pendientes} pendientes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border shadow-sm">
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-muted-foreground mb-4">Facturas Recientes</p>
          <div className="space-y-3">
            {recentInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-sm text-muted-foreground">{invoice.id}</div>
                  <div className="font-medium">{invoice.negocio}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="font-semibold">{invoice.amount}</div>
                  <Badge
                    variant={invoice.status === "pagada" ? "default" : invoice.status === "pendiente" ? "secondary" : "destructive"}
                    className={invoice.status === "pagada" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" : ""}
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardContent className="pt-5">
          <p className="text-sm font-medium text-muted-foreground mb-4">Facturación Histórica</p>
          <div className="h-[300px]">
            {historicalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <defs>
                    <linearGradient id="colorFacturacionArtista" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FFC442" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FFC442" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => `€${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(value: number) => [`€${value.toLocaleString()}`, 'Facturación']}
                  />
                  <Area type="monotone" dataKey="facturacion" stroke="#FFC442" fillOpacity={1} fill="url(#colorFacturacionArtista)" name="Facturación" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No hay datos históricos disponibles
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
