import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useNegocioConfig() {
  return useQuery({
    queryKey: ["negocio-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("negocios")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateNegocioConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id?: string;
      nombre: string;
      tipo?: string | null;
      ubicacion?: string | null;
      capacidad?: number | null;
      descripcion?: string | null;
      presupuesto_min?: number | null;
      presupuesto_max?: number | null;
      hora_apertura?: string | null;
      hora_cierre?: string | null;
    }) => {
      if (data.id) {
        const { error } = await supabase
          .from("negocios")
          .update(data)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("negocios").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negocio-config"] });
    },
  });
}
