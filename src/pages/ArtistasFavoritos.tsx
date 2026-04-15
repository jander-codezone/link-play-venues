import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Heart } from "lucide-react";
import { useFavoritos } from "@/hooks/useFavoritos";
import { toast } from "sonner";
import { ArtistaCard } from "@/components/artistas/ArtistaCard";
import { getArtistPriceRangeDisplay, ArtistaPriceable } from "@/lib/artistaUtils";

export default function ArtistasFavoritos() {
  const { favoritos, toggleFavorito, isFavorito } = useFavoritos();

  const { data: artistas, isLoading } = useQuery({
    queryKey: ["artistas-favoritos", favoritos],
    queryFn: async () => {
      if (favoritos.length === 0) return [];
      const { data } = await supabase
        .from("artistas")
        .select("*")
        .in("id", favoritos)
        .order("nombre", { ascending: true });
      return data || [];
    },
    enabled: true,
  });

  const handleToggleFavorito = (id: string) => {
    const artista = artistas?.find((a) => a.id === id);
    const wasFavorito = isFavorito(id);
    toggleFavorito(id);
    toast.success(
      wasFavorito
        ? `${artista?.nombre || "Artista"} eliminado de favoritos`
        : `${artista?.nombre || "Artista"} añadido a favoritos`
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500">
          <Heart className="h-6 w-6 text-white fill-white" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Artistas Favoritos</h1>
          <p className="text-muted-foreground">
            Tu lista de artistas guardados
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 bg-card rounded-xl animate-pulse overflow-hidden">
              <div className="h-24 w-24 bg-secondary shrink-0" />
              <div className="flex-1 space-y-2 py-3">
                <div className="h-5 bg-secondary rounded w-3/4" />
                <div className="h-4 bg-secondary rounded w-full" />
                <div className="flex gap-2">
                  <div className="h-5 bg-secondary rounded w-16" />
                  <div className="h-5 bg-secondary rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !artistas?.length ? (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="py-16 text-center">
            <Heart className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <p className="mt-4 text-lg text-muted-foreground">
              No tienes artistas favoritos
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Explora el catálogo y guarda tus artistas preferidos
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <a href="/artistas">Explorar Artistas</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {artistas.map((artista) => (
            <ArtistaCard
              key={artista.id}
              id={artista.id}
              nombre={artista.nombre}
              descripcion={artista.descripcion || ""}
              estilo={artista.estilo || ""}
              cachePagado={getArtistPriceRangeDisplay(artista as ArtistaPriceable)}
              fotoUrl={artista.foto_url || undefined}
              isFavorito={isFavorito(artista.id)}
              onToggleFavorito={handleToggleFavorito}
            />
          ))}
        </div>
      )}
    </div>
  );
}
