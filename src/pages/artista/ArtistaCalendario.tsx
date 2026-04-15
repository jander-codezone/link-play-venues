import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, getWeek } from "date-fns";
import { es } from "date-fns/locale";

const hours = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", 
  "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00",
];

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function ArtistaCalendario() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendario</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu agenda de eventos</p>
      </div>

      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-center">
            <h2 className="text-lg font-semibold capitalize">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </h2>
            <p className="text-sm text-muted-foreground">Semana {weekNumber}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant={viewMode === "week" ? "outline" : "ghost"} size="sm" onClick={goToToday} className="rounded-lg">
              Hoy
            </Button>
            <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode(viewMode === "week" ? "month" : "week")} className="rounded-lg">
              Mes
            </Button>
          </div>
        </div>

        <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/40">
            <div className="p-3 text-sm text-muted-foreground bg-muted/50 border-r border-border/40">Hora</div>
            {weekDays.map((day, index) => (
              <div key={index} className="p-3 border-r border-border/40 last:border-r-0 relative flex items-center justify-center">
                <span className="text-sm font-medium">{dayNames[index]}</span>
                <span className="absolute top-2 right-3 text-xs text-muted-foreground">{format(day, "d")}</span>
              </div>
            ))}
          </div>

          <div>
            {hours.map((hour) => {
              const isFullHour = hour.endsWith(":00");
              return (
                <div key={hour} className={`grid grid-cols-[60px_repeat(7,1fr)] border-b last:border-b-0 ${isFullHour ? "border-border/60" : "border-border/30"}`}>
                  <div className="p-2 text-sm text-muted-foreground bg-muted/50 border-r border-border/40 flex items-center justify-start pl-3">{hour}</div>
                  {weekDays.map((_, dayIndex) => (
                    <div key={dayIndex} className="p-2 min-h-[32px] border-r border-border/40 last:border-r-0 hover:bg-muted/30 transition-colors cursor-pointer" />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm text-muted-foreground">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm text-muted-foreground">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-sm text-muted-foreground">Pendiente</span>
          </div>
        </div>
      </div>
    </div>
  );
}
