import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CalendarRecommendation {
  fecha: string;
  artista_id: string;
  nombre: string;
  hora_sugerida: number;
  duracion_sugerida: number;
  cache_estimado: number;
  razon: string;
}

export interface CalendarRecommendationResponse {
  programacion: CalendarRecommendation[];
  presupuesto_total: number;
  resumen: string;
}

export function useAIRecommendations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const getCalendarRecommendations = async (
    negocioId: string,
    fechaInicio: string,
    fechaFin: string,
    presupuestoSemanal?: number
  ): Promise<CalendarRecommendationResponse | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-recommendations", {
        body: { type: "calendar", negocioId, fechaInicio, fechaFin, presupuestoSemanal },
      });
      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);
      return data as CalendarRecommendationResponse;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al obtener propuesta";
      setError(message);
      toast({ title: "Error", description: message, variant: "destructive" });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, getCalendarRecommendations };
}
