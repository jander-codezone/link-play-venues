import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CreateNotificacionParams {
  artista_id: string;
  evento_id: string;
  titulo: string;
  mensaje: string;
  tipo: string;
}

export function useNotificaciones() {
  return useQuery({
    queryKey: ["notificaciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNotificacion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificacion: CreateNotificacionParams) => {
      const { data, error } = await supabase
        .from("notificaciones")
        .insert({
          artista_id: notificacion.artista_id,
          evento_id: notificacion.evento_id,
          titulo: notificacion.titulo,
          mensaje: notificacion.mensaje,
          tipo: notificacion.tipo,
          leida: false,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
}

export function useCreateNotificacionesBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (notificaciones: CreateNotificacionParams[]) => {
      const { data, error } = await supabase
        .from("notificaciones")
        .insert(
          notificaciones.map(n => ({
            artista_id: n.artista_id,
            evento_id: n.evento_id,
            titulo: n.titulo,
            mensaje: n.mensaje,
            tipo: n.tipo,
            leida: false,
          }))
        )
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificaciones"] });
    },
  });
}
