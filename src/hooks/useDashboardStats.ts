import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardStats() {
  const artistasQuery = useQuery({
    queryKey: ["artistas-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("artistas")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const eventosQuery = useQuery({
    queryKey: ["eventos-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("eventos")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const contratacionesQuery = useQuery({
    queryKey: ["contrataciones-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("contrataciones")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const gastoTotalQuery = useQuery({
    queryKey: ["gasto-total"],
    queryFn: async () => {
      const { data } = await supabase.from("contrataciones").select("cache_pagado");
      return data?.reduce((sum, c) => sum + (Number(c.cache_pagado) || 0), 0) || 0;
    },
  });

  return {
    artistasCount: artistasQuery.data ?? 0,
    eventosCount: eventosQuery.data ?? 0,
    contratacionesCount: contratacionesQuery.data ?? 0,
    gastoTotal: gastoTotalQuery.data ?? 0,
    isLoading:
      artistasQuery.isLoading ||
      eventosQuery.isLoading ||
      contratacionesQuery.isLoading ||
      gastoTotalQuery.isLoading,
  };
}
