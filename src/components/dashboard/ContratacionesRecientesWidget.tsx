import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight } from "lucide-react";
import { useContratacionesRecientes } from "@/hooks/useContrataciones";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { formatNumberWithDots } from "@/lib/formatNumber";

export function ContratacionesRecientesWidget() {
  const { data: contrataciones, isLoading } = useContratacionesRecientes(4);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-600",
      "bg-purple-100 text-purple-600",
      "bg-green-100 text-green-600",
      "bg-orange-100 text-orange-600",
      "bg-pink-100 text-pink-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base font-display">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold">Contrataciones</p>
              <p className="text-xs text-muted-foreground font-normal">
                Actividad reciente
              </p>
            </div>
          </CardTitle>
          <Link
            to="/contrataciones"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-secondary rounded w-1/2" />
                  <div className="h-3 bg-secondary rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : contrataciones && contrataciones.length > 0 ? (
          <div className="space-y-3">
            {contrataciones.map((contratacion) => {
              const artistName = contratacion.artistas?.nombre || "Artista";
              return (
                <div
                  key={contratacion.id}
                  className="flex items-center gap-3"
                >
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-semibold ${getAvatarColor(artistName)}`}
                  >
                    {getInitials(artistName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{artistName}</p>
                    <p className="text-xs text-muted-foreground">
                      {contratacion.fecha
                        ? format(new Date(contratacion.fecha), "d MMM yyyy", {
                            locale: es,
                          })
                        : "Sin fecha"}
                    </p>
                  </div>
                  {contratacion.cache_pagado && (
                    <p className="text-sm font-semibold">
                      {formatNumberWithDots(Number(contratacion.cache_pagado).toString())} €
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay contrataciones recientes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
