import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useContrataciones() {
  return useQuery({
    queryKey: ["contrataciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrataciones")
        .select("*, artistas(nombre, foto_url), negocios(nombre)")
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useContratacionesRecientes(limit: number = 5) {
  return useQuery({
    queryKey: ["contrataciones-recientes", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrataciones")
        .select("*, artistas(nombre, foto_url)")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useGastosMensuales() {
  return useQuery({
    queryKey: ["gastos-mensuales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contrataciones")
        .select("fecha, cache_pagado");
      if (error) throw error;
      return data || [];
    },
  });
}
