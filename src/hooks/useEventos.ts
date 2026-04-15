import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EventoDB {
  id: string;
  artista_id: string | null;
  fecha: string | null;
  hora_inicio: string | null;
  duracion: number | null;
  artista_confirmado: boolean | null;
  pago_realizado: boolean | null;
  notas: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EventoConArtista extends EventoDB {
  artistas: {
    id: string;
    nombre: string;
    cache: number | null;
    foto_url: string | null;
  } | null;
}

export type EstadoEvento = "completado" | "confirmado" | "pendiente";

export function calcularEstadoEvento(
  fecha: string | null,
  artista_confirmado: boolean | null,
  pago_realizado: boolean | null
): EstadoEvento {
  if (!fecha) return "pendiente";
  
  const fechaEvento = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  fechaEvento.setHours(0, 0, 0, 0);
  
  const fechaPasada = fechaEvento < hoy;
  
  if (artista_confirmado && fechaPasada && pago_realizado) {
    return "completado";
  }
  
  if (artista_confirmado && !fechaPasada) {
    return "confirmado";
  }
  
  return "pendiente";
}

// Helper to convert time string (HH:MM:SS) to minutes
export function timeStringToMinutes(time: string | null): number {
  if (!time) return 0;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

// Helper to convert minutes to time string (HH:MM:SS)
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00`;
}

export function useEventos() {
  return useQuery({
    queryKey: ["eventos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select(`
          *,
          artistas (
            id,
            nombre,
            cache,
            foto_url
          )
        `)
        .order("fecha");
      
      if (error) throw error;
      return data as EventoConArtista[];
    },
  });
}

export function useEventosPorSemana(fechaInicio: Date = new Date()) {
  const fechaFin = new Date(fechaInicio);
  fechaFin.setDate(fechaFin.getDate() + 6);
  
  return useQuery({
    queryKey: ["eventos", "semana", fechaInicio.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("eventos")
        .select(`
          *,
          artistas (
            id,
            nombre,
            cache,
            foto_url
          )
        `)
        .gte("fecha", fechaInicio.toISOString().split("T")[0])
        .lte("fecha", fechaFin.toISOString().split("T")[0])
        .order("fecha");
      
      if (error) throw error;
      return data as EventoConArtista[];
    },
  });
}

// Alias for backward compatibility
export const useEventosSemana = useEventosPorSemana;

export function useCreateEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (evento: {
      artista_id: string;
      fecha: string;
      hora_inicio: string;
      duracion: number;
      artista_confirmado?: boolean;
      pago_realizado?: boolean;
      notas?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("eventos")
        .insert(evento)
        .select(`
          *,
          artistas (
            id,
            nombre,
            cache,
            foto_url
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}

export function useUpdateEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<{
      artista_id: string;
      fecha: string;
      hora_inicio: string;
      duracion: number;
      artista_confirmado: boolean;
      pago_realizado: boolean;
      notas: string | null;
    }>) => {
      const { data, error } = await supabase
        .from("eventos")
        .update(updates)
        .eq("id", id)
        .select(`
          *,
          artistas (
            id,
            nombre,
            cache,
            foto_url
          )
        `)
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}

export function useDeleteEvento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
    },
  });
}
