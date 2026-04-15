import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Music, ArrowRight } from "lucide-react";
import { useArtistasFavoritos } from "@/hooks/useArtistas";
import { Link } from "react-router-dom";
import { formatNumberWithDots } from "@/lib/formatNumber";

export function ArtistasFavoritosWidget() {
  const { data: artistas, isLoading } = useArtistasFavoritos(4);

  return (
    <Card className="border-border bg-card shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-base font-display">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-pink-500/10">
              <Heart className="h-4 w-4 text-pink-500" />
            </div>
            <div>
              <p className="font-semibold">Tus Artistas</p>
              <p className="text-xs text-muted-foreground font-normal">
                {artistas?.length || 0} en tu lista
              </p>
            </div>
          </CardTitle>
          <Link
            to="/artistas/favoritos"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[4/3] rounded-xl bg-secondary" />
              </div>
            ))}
          </div>
        ) : artistas && artistas.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {artistas.slice(0, 4).map((artista) => (
              <div
                key={artista.id}
                className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary cursor-pointer"
              >
                {artista.foto_url ? (
                  <img
                    src={artista.foto_url}
                    alt={artista.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                    <Music className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-sm font-semibold text-white truncate">
                    {artista.nombre}
                  </p>
                  {artista.cache && (
                    <p className="text-xs text-white/70">
                      {formatNumberWithDots(Number(artista.cache).toString())} €
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Heart className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-2 text-sm text-muted-foreground">
              No hay artistas favoritos
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
