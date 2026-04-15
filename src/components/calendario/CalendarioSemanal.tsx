import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface Evento {
  id: string;
  artista: string;
  horaInicio: number;
  duracion: number;
  estado: "confirmado" | "pendiente" | "completado";
  artistaId?: string;
  fecha?: string;
}

interface DiaCalendario {
  nombre: string;
  numeroDia?: number;
  fecha?: string;
  eventos: Evento[];
}

interface CalendarioSemanalProps {
  dias: DiaCalendario[];
  horaInicio?: number;
  horaFin?: number;
  onDropArtista?: (diaNombre: string, horaInicio: number, artista: { id: string; nombre: string }) => void;
  onRemoveEvento?: (diaNombre: string, eventoId: string) => void;
  onMoveEvento?: (diaOrigen: string, diaDestino: string, evento: Evento, nuevaHoraInicio?: number) => void;
  onResizeEvento?: (diaNombre: string, eventoId: string, nuevaDuracion: number) => void;
}

const estadoClasses = {
  confirmado: "bg-yellow-500/30 border-yellow-500/60 text-yellow-700 dark:text-yellow-300",
  pendiente: "bg-destructive/30 border-destructive/60 text-destructive",
  completado: "bg-success/30 border-success/60 text-success",
};

const INTERVALO_MINUTOS = 30;
const PIXELS_POR_HORA = 80;

const generarSlots = (horaInicio: number, horaFin: number) => {
  const slots: { hora: number; label: string }[] = [];
  const horaInicioH = Math.floor(horaInicio / 60);
  const horaFinH = Math.ceil(horaFin / 60);
  for (let h = horaInicioH; h <= horaFinH; h++) {
    for (let m = 0; m < 60; m += INTERVALO_MINUTOS) {
      const minutosTotales = h * 60 + m;
      if (minutosTotales < horaInicio || minutosTotales > horaFin) continue;
      slots.push({ hora: minutosTotales, label: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}` });
    }
  }
  return slots;
};

const minutosAPixels = (minutos: number) => (minutos / 60) * PIXELS_POR_HORA;
const pixelsAMinutos = (pixels: number) => (pixels / PIXELS_POR_HORA) * 60;
const formatearHora = (minutos: number) => `${Math.floor(minutos / 60).toString().padStart(2, "0")}:${(minutos % 60).toString().padStart(2, "0")}`;

export function CalendarioSemanal({ dias, horaInicio = 0, horaFin = 360, onDropArtista, onRemoveEvento, onMoveEvento, onResizeEvento }: CalendarioSemanalProps) {
  const SLOTS = generarSlots(horaInicio, horaFin);
  const DURACION_TOTAL = horaFin - horaInicio + INTERVALO_MINUTOS;

  const [dragOverDay, setDragOverDay] = useState<string | null>(null);
  const [dragOverHora, setDragOverHora] = useState<number | null>(null);
  const [resizing, setResizing] = useState<{ diaNombre: string; eventoId: string; startY: number; startDuracion: number } | null>(null);
  const [previewDuracion, setPreviewDuracion] = useState<number | null>(null);
  const [committedResize, setCommittedResize] = useState<{ eventoId: string; duracion: number } | null>(null);
  const previewDuracionRef = useRef<number | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    previewDuracionRef.current = previewDuracion;
  }, [previewDuracion]);

  // Clear committed resize when actual data matches
  useEffect(() => {
    if (committedResize) {
      const eventoActual = dias.flatMap(d => d.eventos).find(e => e.id === committedResize.eventoId);
      if (eventoActual && eventoActual.duracion === committedResize.duracion) {
        setCommittedResize(null);
      }
    }
  }, [dias, committedResize]);

  const getEventoHoraInicio = (diaNombre: string, eventoId: string): number => {
    const dia = dias.find(d => d.nombre === diaNombre);
    return dia?.eventos.find(e => e.id === eventoId)?.horaInicio ?? 0;
  };

  useEffect(() => {
    if (!resizing) { setPreviewDuracion(null); return; }
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - resizing.startY;
      const deltaMinutos = Math.round(pixelsAMinutos(deltaY) / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
      const nuevaDuracion = Math.max(INTERVALO_MINUTOS, resizing.startDuracion + deltaMinutos);
      const maxDuracion = DURACION_TOTAL - (getEventoHoraInicio(resizing.diaNombre, resizing.eventoId) - horaInicio);
      setPreviewDuracion(Math.min(nuevaDuracion, maxDuracion));
    };
    
    const handleMouseUp = () => {
      const finalDuracion = previewDuracionRef.current;
      if (finalDuracion !== null && onResizeEvento) {
        // Store the committed resize to prevent spring-back effect
        setCommittedResize({ eventoId: resizing.eventoId, duracion: finalDuracion });
        onResizeEvento(resizing.diaNombre, resizing.eventoId, finalDuracion);
      }
      setResizing(null);
    };
    
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => { 
      document.removeEventListener("mousemove", handleMouseMove); 
      document.removeEventListener("mouseup", handleMouseUp); 
    };
  }, [resizing, onResizeEvento, DURACION_TOTAL, horaInicio]);

  const handleDragOver = (e: React.DragEvent, diaNombre: string) => {
    e.preventDefault();
    setDragOverDay(diaNombre);
    const rect = e.currentTarget.getBoundingClientRect();
    const minutosDesdeInicio = Math.round(pixelsAMinutos(e.clientY - rect.top) / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
    setDragOverHora(horaInicio + Math.max(0, Math.min(minutosDesdeInicio, DURACION_TOTAL - INTERVALO_MINUTOS)));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      setDragOverDay(null); setDragOverHora(null);
    }
  };

  const handleDrop = (e: React.DragEvent, diaNombre: string) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const minutosDesdeInicio = Math.round(pixelsAMinutos(e.clientY - rect.top) / INTERVALO_MINUTOS) * INTERVALO_MINUTOS;
    const horaAbsoluta = horaInicio + Math.max(0, Math.min(minutosDesdeInicio, DURACION_TOTAL - INTERVALO_MINUTOS));
    setDragOverDay(null); setDragOverHora(null);

    const jsonData = e.dataTransfer.getData("application/json");
    if (jsonData) {
      try {
        const data = JSON.parse(jsonData);
        if (data.isExistingEvent && onMoveEvento) {
          const { diaOrigen, isExistingEvent, ...evento } = data;
          onMoveEvento(diaOrigen, diaNombre, evento, horaAbsoluta);
          return;
        }
      } catch {}
    }
    const artistaData = e.dataTransfer.getData("artista");
    if (artistaData && onDropArtista) {
      try { onDropArtista(diaNombre, horaAbsoluta, JSON.parse(artistaData)); } catch {}
    }
  };

  const alturaTotal = DURACION_TOTAL / 60 * PIXELS_POR_HORA;

  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden select-none">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
        <div className="px-2 py-3 text-center bg-muted/30 border-r border-border"><span className="font-display font-semibold text-xs text-muted-foreground">Hora</span></div>
        {dias.map((dia, i) => (
          <div key={dia.nombre} className={cn("px-2 py-3 border-r border-border last:border-r-0 relative text-center", i >= 5 ? "bg-muted/30" : "bg-card")}>
            <span className="font-display font-semibold text-sm text-foreground">{dia.nombre}</span>
            {dia.numeroDia !== undefined && <span className="absolute top-1 right-2 text-xs font-medium text-muted-foreground">{dia.numeroDia}</span>}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        <div className="border-r border-border bg-muted/20" style={{ height: alturaTotal }}>
          {SLOTS.map(slot => (<div key={slot.hora} className="border-b border-border/50 flex items-start justify-end pr-2 pt-1" style={{ height: minutosAPixels(INTERVALO_MINUTOS) }}><span className="text-xs text-muted-foreground font-mono">{slot.label}</span></div>))}
        </div>
        {dias.map((dia, index) => (
          <div key={`${dia.nombre}-content`} onDragOver={e => handleDragOver(e, dia.nombre)} onDragLeave={handleDragLeave} onDrop={e => handleDrop(e, dia.nombre)} className={cn("border-r border-border last:border-r-0 relative", index >= 5 ? "bg-muted/10" : "bg-card", dragOverDay === dia.nombre && "bg-primary/5")} style={{ height: alturaTotal }}>
            {SLOTS.map((slot, si) => (<div key={`${dia.nombre}-${slot.hora}`} className={cn("border-b absolute w-full pointer-events-none", slot.hora % 60 === 0 ? "border-border/60" : "border-border/30")} style={{ top: si * minutosAPixels(INTERVALO_MINUTOS), height: minutosAPixels(INTERVALO_MINUTOS) }} />))}
            {dragOverDay === dia.nombre && dragOverHora !== null && (<div className="absolute left-1 right-1 bg-primary/20 border-2 border-dashed border-primary rounded-md pointer-events-none z-10 flex items-center justify-center" style={{ top: minutosAPixels(dragOverHora - horaInicio), height: minutosAPixels(60) }}><span className="text-xs font-medium text-primary">{formatearHora(dragOverHora)}</span></div>)}
            {dia.eventos.map(evento => {
              const isResizingThis = resizing?.eventoId === evento.id && resizing?.diaNombre === dia.nombre;
              const hasCommittedResize = committedResize?.eventoId === evento.id;
              const displayDuracion = isResizingThis && previewDuracion !== null 
                ? previewDuracion 
                : hasCommittedResize 
                  ? committedResize.duracion 
                  : evento.duracion;
              return (
                <div key={evento.id} className="relative">
                  {/* Shadow/guide showing the resize preview */}
                  {isResizingThis && previewDuracion !== null && (
                    <div 
                      className="absolute left-1 right-1 bg-primary/10 border-2 border-dashed border-primary/50 rounded-lg pointer-events-none z-10 transition-all duration-75"
                      style={{ 
                        top: minutosAPixels(evento.horaInicio - horaInicio), 
                        height: Math.max(minutosAPixels(previewDuracion) - 2, 24) 
                      }}
                    >
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                        {formatearHora(evento.horaInicio + previewDuracion)} ({previewDuracion} min)
                      </div>
                    </div>
                  )}
                  <div draggable={!resizing} onDragStart={e => { e.dataTransfer.setData("application/json", JSON.stringify({ ...evento, diaOrigen: dia.nombre, isExistingEvent: true })); }} className={cn("absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1 hover:shadow-lg z-20 overflow-hidden transition-all", estadoClasses[evento.estado], isResizingThis ? "cursor-ns-resize ring-2 ring-primary" : "cursor-grab active:cursor-grabbing")} style={{ top: minutosAPixels(evento.horaInicio - horaInicio), height: Math.max(minutosAPixels(displayDuracion) - 2, 24) }}>
                    <div className="flex items-start justify-between gap-1 h-full">
                      <div className="flex-1 min-w-0"><p className="text-xs font-semibold truncate">{evento.artista}</p><p className="text-[10px] opacity-75">{formatearHora(evento.horaInicio)} - {formatearHora(evento.horaInicio + displayDuracion)}</p></div>
                      {onRemoveEvento && !isResizingThis && (<button onClick={e => { e.stopPropagation(); onRemoveEvento(dia.nombre, evento.id); }} className="flex-shrink-0 hover:bg-background/30 rounded p-0.5"><X className="h-3 w-3" /></button>)}
                    </div>
                    {onResizeEvento && (<div className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize hover:bg-background/40 flex items-center justify-center group" onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setResizing({ diaNombre: dia.nombre, eventoId: evento.id, startY: e.clientY, startDuracion: evento.duracion }); }}><div className="w-10 h-1 bg-current rounded-full opacity-40 group-hover:opacity-70" /></div>)}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
