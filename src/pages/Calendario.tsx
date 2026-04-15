import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Trash2, Send, Sparkles, ChevronDown, Wallet } from "lucide-react";
import { format, startOfWeek, addDays, addWeeks, subWeeks, getWeek, setMonth, setYear, getMonth, getYear } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CalendarioSemanal } from "@/components/calendario/CalendarioSemanal";
import { ArtistasPool } from "@/components/calendario/ArtistasPool";
import { AICalendarProposalDialog } from "@/components/ai/AICalendarProposalDialog";
import { CalendarRecommendation } from "@/hooks/useAIRecommendations";
import { 
  useEventosPorSemana, 
  useCreateEvento, 
  useUpdateEvento, 
  useDeleteEvento,
  calcularEstadoEvento,
  timeStringToMinutes,
  minutesToTimeString
} from "@/hooks/useEventos";
import { useArtistasFavoritos } from "@/hooks/useArtistas";
import { useCreateNotificacionesBatch } from "@/hooks/useNotificaciones";
import { useNegocioConfig } from "@/hooks/useNegocioConfig";
import { useToast } from "@/hooks/use-toast";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Calendario() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const { toast } = useToast();

  const { data: eventos, isLoading: loadingEventos } = useEventosPorSemana(weekStart);
  const { data: artistas, isLoading: loadingArtistas } = useArtistasFavoritos(10);
  const { data: negocioConfig } = useNegocioConfig();
  
  const createEvento = useCreateEvento();
  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();
  const createNotificaciones = useCreateNotificacionesBatch();

  // Check if there are pending events (not confirmed)
  const eventosPendientes = eventos?.filter(e => !e.artista_confirmado) || [];
  const hayEventosPendientes = eventosPendientes.length > 0;

  // Calculate total potential expense for the week
  const gastoPotencial = useMemo(() => {
    if (!eventos?.length) return 0;
    return eventos.reduce((total, evento) => {
      return total + (evento.artistas?.cache || 0);
    }, 0);
  }, [eventos]);

  const handleConfirmarProgramacion = async () => {
    if (!eventosPendientes.length) return;
    
    try {
      // Create notifications for each pending event
      const notificaciones = eventosPendientes
        .filter(e => e.artista_id && e.fecha && e.hora_inicio)
        .map(evento => ({
          artista_id: evento.artista_id!,
          evento_id: evento.id,
          titulo: "Solicitud de contratación",
          mensaje: `Te queremos contratar para el ${format(new Date(evento.fecha!), "d 'de' MMMM", { locale: es })} a las ${evento.hora_inicio?.slice(0, 5)}h`,
          tipo: "solicitud_contratacion",
        }));
      
      if (notificaciones.length > 0) {
        await createNotificaciones.mutateAsync(notificaciones);
      }
      
      toast({
        title: "Notificaciones enviadas",
        description: `Se han enviado ${notificaciones.length} solicitudes a los artistas`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron enviar las notificaciones",
        variant: "destructive",
      });
    }
  };

  // Transform eventos to calendar format
  const diasCalendario = DIAS_SEMANA.map((nombre, index) => {
    const fecha = addDays(weekStart, index);
    const fechaStr = format(fecha, "yyyy-MM-dd");
    
    const eventosDelDia = eventos?.filter(e => e.fecha === fechaStr) || [];
    
    return {
      nombre,
      numeroDia: fecha.getDate(),
      fecha: fechaStr,
      eventos: eventosDelDia.map(e => ({
        id: e.id,
        artista: e.artistas?.nombre || "Sin artista",
        horaInicio: timeStringToMinutes(e.hora_inicio),
        duracion: e.duracion || 60,
        estado: calcularEstadoEvento(e.fecha, e.artista_confirmado, e.pago_realizado),
        artistaId: e.artista_id || undefined,
        fecha: e.fecha || undefined,
      })),
    };
  });

  const handleDropArtista = async (
    diaNombre: string, 
    horaInicio: number, 
    artista: { id: string; nombre: string }
  ) => {
    const diaIndex = DIAS_SEMANA.indexOf(diaNombre);
    if (diaIndex === -1) return;
    
    const fecha = addDays(weekStart, diaIndex);
    const fechaStr = format(fecha, "yyyy-MM-dd");
    
    try {
      await createEvento.mutateAsync({
        artista_id: artista.id,
        fecha: fechaStr,
        hora_inicio: minutesToTimeString(horaInicio),
        duracion: 60,
        artista_confirmado: false,
        pago_realizado: false,
      });
      toast({
        title: "Evento creado",
        description: `${artista.nombre} programado para el ${format(fecha, "d 'de' MMMM", { locale: es })}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el evento",
        variant: "destructive",
      });
    }
  };

  const handleRemoveEvento = async (diaNombre: string, eventoId: string) => {
    try {
      await deleteEvento.mutateAsync(eventoId);
      toast({
        title: "Evento eliminado",
        description: "El evento ha sido eliminado del calendario",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      });
    }
  };

  const handleMoveEvento = async (
    diaOrigen: string,
    diaDestino: string,
    evento: { id: string; horaInicio: number },
    nuevaHoraInicio?: number
  ) => {
    const diaDestinoIndex = DIAS_SEMANA.indexOf(diaDestino);
    if (diaDestinoIndex === -1) return;
    
    const nuevaFecha = addDays(weekStart, diaDestinoIndex);
    const fechaStr = format(nuevaFecha, "yyyy-MM-dd");
    
    try {
      await updateEvento.mutateAsync({
        id: evento.id,
        fecha: fechaStr,
        hora_inicio: minutesToTimeString(nuevaHoraInicio ?? evento.horaInicio),
      });
      toast({
        title: "Evento movido",
        description: `Evento reprogramado al ${format(nuevaFecha, "d 'de' MMMM", { locale: es })}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo mover el evento",
        variant: "destructive",
      });
    }
  };

  const handleResizeEvento = async (
    diaNombre: string,
    eventoId: string,
    nuevaDuracion: number
  ) => {
    try {
      await updateEvento.mutateAsync({
        id: eventoId,
        duracion: nuevaDuracion,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la duración",
        variant: "destructive",
      });
    }
  };

  const handleClearCalendar = async () => {
    if (!eventos?.length) return;
    
    try {
      await Promise.all(eventos.map(e => deleteEvento.mutateAsync(e.id)));
      toast({
        title: "Calendario limpiado",
        description: "Se han eliminado todos los eventos de la semana",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron eliminar todos los eventos",
        variant: "destructive",
      });
    }
  };

  const handleApplyAIProposal = async (programacion: CalendarRecommendation[]) => {
    try {
      for (const item of programacion) {
        await createEvento.mutateAsync({
          artista_id: item.artista_id,
          fecha: item.fecha,
          hora_inicio: minutesToTimeString(item.hora_sugerida * 60),
          duracion: item.duracion_sugerida,
          artista_confirmado: false,
          pago_realizado: false,
        });
      }
      toast({
        title: "Propuesta aplicada",
        description: `Se han añadido ${programacion.length} eventos al calendario`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aplicar la propuesta completa",
        variant: "destructive",
      });
    }
  };

  // Calculate hour range based on negocio config or default values (00:00 - 06:00)
  const horaInicio = negocioConfig?.hora_apertura 
    ? timeStringToMinutes(negocioConfig.hora_apertura)
    : 0; // Default 00:00
  
  const horaFin = negocioConfig?.hora_cierre
    ? timeStringToMinutes(negocioConfig.hora_cierre)
    : 6 * 60; // Default 06:00
  
  // Handle overnight hours (e.g., opens at 22:00, closes at 06:00)
  const horaFinAjustada = horaFin <= horaInicio ? horaFin + 24 * 60 : horaFin;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header Row 1: Title, Expense Tracker and Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="font-display text-3xl font-bold">Calendario</h1>
          
          {/* Expense Tracker */}
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
            <Wallet className="h-5 w-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-none">Gasto potencial</span>
              <span className="text-lg font-bold text-primary leading-tight">
                {gastoPotencial.toLocaleString('es-ES')} €
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className={`rounded-xl gap-2 transition-colors ${
              hayEventosPendientes 
                ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 hover:border-yellow-600" 
                : ""
            }`}
            onClick={handleConfirmarProgramacion}
            disabled={!hayEventosPendientes || createNotificaciones.isPending}
          >
            <Send className="h-4 w-4" />
            Confirmar programación
          </Button>
          <AICalendarProposalDialog 
            defaultStartDate={weekStart}
            onApplyProposal={handleApplyAIProposal}
            trigger={
              <Button className="rounded-xl gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                <Sparkles className="h-4 w-4" />
                Propuesta IA
              </Button>
            }
          />
        </div>
      </div>

      {/* Header Row 2: Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="rounded-xl"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="rounded-xl"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-1 text-lg font-semibold hover:text-primary transition-colors">
                  {MESES[getMonth(weekStart)]}
                  <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border max-h-64 overflow-y-auto">
                {MESES.map((mes, index) => (
                  <DropdownMenuItem
                    key={mes}
                    onClick={() => setCurrentWeek(setMonth(currentWeek, index))}
                    className={getMonth(weekStart) === index ? "bg-primary/10 text-primary" : ""}
                  >
                    {mes}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-1 text-lg font-semibold hover:text-primary transition-colors">
                  {getYear(weekStart)}
                  <ChevronDown className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-card border-border">
                {Array.from({ length: 5 }, (_, i) => getYear(new Date()) - 1 + i).map((year) => (
                  <DropdownMenuItem
                    key={year}
                    onClick={() => setCurrentWeek(setYear(currentWeek, year))}
                    className={getYear(weekStart) === year ? "bg-primary/10 text-primary" : ""}
                  >
                    {year}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">Semana {getWeek(weekStart)}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setCurrentWeek(new Date())}
            className="rounded-xl px-4"
          >
            Hoy
          </Button>
          <Button variant="outline" className="rounded-xl px-4">
            Mes
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <CalendarioSemanal
        dias={diasCalendario}
        horaInicio={horaInicio}
        horaFin={horaFinAjustada}
        onDropArtista={handleDropArtista}
        onRemoveEvento={handleRemoveEvento}
        onMoveEvento={handleMoveEvento}
        onResizeEvento={handleResizeEvento}
      />

      {/* Legend and Clear Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Completado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">Confirmado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-sm text-muted-foreground">Pendiente</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearCalendar}
          disabled={!eventos?.length}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Limpiar Calendario
        </Button>
      </div>

      {/* Artists Pool */}
      <ArtistasPool 
        artistas={artistas || []} 
        onDragStart={() => {}} 
      />
    </div>
  );
}
