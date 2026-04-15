import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useArtistas(limit?: number) {
  return useQuery({
    queryKey: ["artistas", limit],
    queryFn: async () => {
      let query = supabase
        .from("artistas")
        .select("*")
        .order("nombre", { ascending: true });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

export function useArtistasFavoritos(limit?: number) {
  return useQuery({
    queryKey: ["artistas-favoritos", limit],
    queryFn: async () => {
      let query = supabase
        .from("artistas")
        .select("*")
        .order("cache", { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}
