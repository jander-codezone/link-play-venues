import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ArrowRight } from "lucide-react";
import { useEventosSemana } from "@/hooks/useEventos";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export function MiniCalendario() {
  const { data: eventos } = useEventosSemana();
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayLabels = ["LU", "MA", "MI", "JU", "VI", "SÁ", "DO"];

  const proximosEventos = eventos?.filter((e) => {
    if (!e.fecha) return false;
    const fecha = new Date(e.fecha);
    return fecha >= today;
  }).slice(0, 3) || [];

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base font-display">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Esta Semana</p>
            <p className="text-xs text-muted-foreground font-normal">
              {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM", { locale: es })}
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {dayLabels.map((label, i) => (
            <div key={label} className="space-y-1">
              <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
              <div
                className={cn(
                  "flex h-9 w-9 mx-auto items-center justify-center rounded-lg text-sm font-semibold transition-colors",
                  isSameDay(weekDays[i], today)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                )}
              >
                {format(weekDays[i], "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Próximos eventos */}
        <div className="pt-2 border-t border-border">
          <p className="text-sm font-medium mb-3">Próximos eventos</p>
          {proximosEventos.length > 0 ? (
            <div className="space-y-2">
              {proximosEventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="flex-1 truncate">
                    {evento.artistas?.nombre || "Evento"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {evento.fecha && format(new Date(evento.fecha), "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay eventos programados
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
