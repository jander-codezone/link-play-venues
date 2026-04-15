import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, AlertCircle, CheckCircle2, FileText, Loader2 } from "lucide-react";

type ContratacionEstado = "pendiente" | "confirmada" | "completada" | "cancelada";

interface Contratacion {
  id: string;
  fecha: string | null;
  cache_pagado: number | null;
  notas: string | null;
  negocio: {
    nombre: string;
    tipo: string | null;
    ubicacion: string | null;
  } | null;
  evento: {
    id: string;
    hora_inicio: string | null;
    duracion: number | null;
    artista_confirmado: boolean | null;
    pago_realizado: boolean | null;
    factura_url: string | null;
    notas: string | null;
  } | null;
}

export default function ArtistaContrataciones() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("todas");

  const { data: artistasIds } = useQuery({
    queryKey: ["artistas-usuario", profile?.user_id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      const { data, error } = await supabase
        .from("artistas")
        .select("id")
        .or(`perfil_artista_id.eq.${profile.user_id},representante_id.eq.${profile.user_id}`);
      if (error) throw error;
      return data?.map(a => a.id) || [];
    },
    enabled: !!profile?.user_id,
  });

  const { data: contrataciones, isLoading } = useQuery({
    queryKey: ["contrataciones-artista", artistasIds],
    queryFn: async () => {
      if (!artistasIds || artistasIds.length === 0) return [];
      const { data, error } = await supabase
        .from("contrataciones")
        .select(`id, fecha, cache_pagado, notas, negocio:negocio_id (nombre, tipo, ubicacion), evento:evento_id (id, hora_inicio, duracion, artista_confirmado, pago_realizado, factura_url, notas)`)
        .in("artista_id", artistasIds)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data as unknown as Contratacion[];
    },
    enabled: !!artistasIds && artistasIds.length > 0,
  });

  const getEstado = (contratacion: Contratacion): ContratacionEstado => {
    if (!contratacion.evento) return "pendiente";
    const fechaEvento = contratacion.fecha ? new Date(contratacion.fecha) : null;
    const hoy = new Date();
    if (fechaEvento && fechaEvento < hoy) return "completada";
    if (contratacion.evento.artista_confirmado) return "confirmada";
    return "pendiente";
  };

  const getEstadoBadge = (estado: ContratacionEstado) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1"><AlertCircle className="h-3 w-3" />Pendiente</Badge>;
      case "confirmada":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1"><Clock className="h-3 w-3" />Confirmada</Badge>;
      case "completada":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" />Completada</Badge>;
      case "cancelada":
        return <Badge variant="destructive" className="gap-1">Cancelada</Badge>;
    }
  };

  const filteredContrataciones = contrataciones?.filter(c => {
    if (activeTab === "todas") return true;
    return getEstado(c) === activeTab;
  }) || [];

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-";
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
  };

  const counts = {
    todas: contrataciones?.length || 0,
    pendiente: contrataciones?.filter(c => getEstado(c) === "pendiente").length || 0,
    confirmada: contrataciones?.filter(c => getEstado(c) === "confirmada").length || 0,
    completada: contrataciones?.filter(c => getEstado(c) === "completada").length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contrataciones</h1>
        <p className="text-muted-foreground mt-1">Gestiona tus contrataciones y eventos confirmados</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="todas">Todas <Badge variant="secondary" className="ml-1 h-5 px-1.5">{counts.todas}</Badge></TabsTrigger>
              <TabsTrigger value="pendiente">Pendientes <Badge variant="secondary" className="ml-1 h-5 px-1.5">{counts.pendiente}</Badge></TabsTrigger>
              <TabsTrigger value="confirmada">Confirmadas <Badge variant="secondary" className="ml-1 h-5 px-1.5">{counts.confirmada}</Badge></TabsTrigger>
              <TabsTrigger value="completada">Completadas <Badge variant="secondary" className="ml-1 h-5 px-1.5">{counts.completada}</Badge></TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredContrataciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay contrataciones para mostrar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Caché</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Factura</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContrataciones.map((contratacion) => (
                    <TableRow key={contratacion.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {contratacion.negocio?.nombre ? getInitials(contratacion.negocio.nombre) : "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contratacion.negocio?.nombre || "Sin asignar"}</p>
                            {contratacion.negocio?.ubicacion && (
                              <p className="text-xs text-muted-foreground">{contratacion.negocio.ubicacion}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{contratacion.fecha ? format(new Date(contratacion.fecha), "d MMM yyyy", { locale: es }) : "-"}</TableCell>
                      <TableCell>{contratacion.evento?.hora_inicio || "-"}</TableCell>
                      <TableCell>{contratacion.evento?.duracion ? `${contratacion.evento.duracion} min` : "-"}</TableCell>
                      <TableCell><span className="font-medium text-muted-foreground">{formatCurrency(contratacion.cache_pagado)}</span></TableCell>
                      <TableCell>{getEstadoBadge(getEstado(contratacion))}</TableCell>
                      <TableCell>
                        {contratacion.evento?.factura_url ? (
                          <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                            <a href={contratacion.evento.factura_url} target="_blank" rel="noopener noreferrer">
                              <FileText className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="truncate text-sm text-muted-foreground">{contratacion.notas || contratacion.evento?.notas || "-"}</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
