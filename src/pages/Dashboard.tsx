import * as React from "react";
import { FileText, Calendar, TrendingUp, Euro, Sparkles } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { GastosChart } from "@/components/dashboard/GastosChart";
import { MiniCalendario } from "@/components/dashboard/MiniCalendario";
import { ArtistasFavoritosWidget } from "@/components/dashboard/ArtistasFavoritosWidget";
import { ContratacionesRecientesWidget } from "@/components/dashboard/ContratacionesRecientesWidget";
import { SugerenciasIABanner } from "@/components/dashboard/SugerenciasIABanner";
import { Button } from "@/components/ui/button";
import { formatNumberWithDots } from "@/lib/formatNumber";

export default function Dashboard() {
  const { artistasCount, eventosCount, contratacionesCount, gastoTotal, isLoading } =
    useDashboardStats();

  const stats = [
    {
      title: "Contrataciones",
      value: String(contratacionesCount),
      description: "Este mes",
      icon: FileText,
    },
    {
      title: "Próximos Eventos",
      value: String(eventosCount),
      description: "Programados",
      icon: Calendar,
    },
    {
      title: "Gasto Promedio",
      value: gastoTotal > 0 && contratacionesCount > 0 
        ? `${formatNumberWithDots(Math.round(gastoTotal / contratacionesCount).toString())} €`
        : "0 €",
      description: "Por contratación",
      icon: TrendingUp,
    },
    {
      title: "Gasto Mensual",
      value: `${formatNumberWithDots(gastoTotal.toString())} €`,
      description: "Total acumulado",
      icon: Euro,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-muted-foreground">
            Aquí tienes un resumen de tu actividad
          </p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Sparkles className="h-4 w-4" />
          Sugerencias IA
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <GastosChart />
        </div>
        <MiniCalendario />
      </div>

      {/* Bottom Widgets */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ArtistasFavoritosWidget />
        <ContratacionesRecientesWidget />
      </div>

      {/* AI Suggestion Banner */}
      <SugerenciasIABanner />
    </div>
  );
}
