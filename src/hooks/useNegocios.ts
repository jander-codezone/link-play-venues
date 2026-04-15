import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Negocio {
  id: string;
  nombre: string;
  tipo: string | null;
  capacidad: number | null;
  ubicacion: string | null;
  estilos_musicales: string[] | null;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  descripcion: string | null;
  dias_apertura: string[] | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
}

export function useNegocios() {
  return useQuery({
    queryKey: ["negocios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("negocios").select("*").order("nombre");
      if (error) throw error;
      return data as Negocio[];
    },
  });
}
