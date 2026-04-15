import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Music, Filter, Sparkles, Users, SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArtistaCard } from "@/components/artistas/ArtistaCard";
import { useFavoritos } from "@/hooks/useFavoritos";
import { toast } from "sonner";
import { formatNumberWithDots } from "@/lib/formatNumber";
import { isStandardArtist, getArtistPriceRangeDisplay, ArtistaPriceable } from "@/lib/artistaUtils";

const TIPOS_EVENTO = ["Concierto", "Festival", "Club", "Evento Privado", "Boda", "Corporativo"];
const GENEROS = ["EDM", "House", "Tech House", "Techno", "Melodic Techno", "Reggaeton", "Pop Latino", "Hip Hop", "R&B", "Rock"];
const MIN_PRICE = 0;
const MAX_PRICE = 500000;

const formatPrice = (value: number) => `${formatNumberWithDots(value.toString())}€`;

interface ArtistasProps {
  mode?: "standard" | "premium";
}

export default function Artistas({ mode = "standard" }: ArtistasProps) {
  const isPremium = mode === "premium";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTipoEvento, setSelectedTipoEvento] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("nombre");
  const [selectedGeneros, setSelectedGeneros] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE]);

  const { toggleFavorito, isFavorito } = useFavoritos();

  const { data: artistas, isLoading } = useQuery({
    queryKey: ["artistas", mode],
    queryFn: async () => {
      const { data } = await supabase
        .from("artistas")
        .select("*")
        .order("nombre", { ascending: true });
      return data || [];
    },
  });

  const toggleGenero = (genero: string) => {
    setSelectedGeneros((prev) =>
      prev.includes(genero)
        ? prev.filter((g) => g !== genero)
        : [...prev, genero]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTipoEvento("all");
    setSelectedGeneros([]);
    setPriceRange([MIN_PRICE, MAX_PRICE]);
  };

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== "" ||
      selectedTipoEvento !== "all" ||
      selectedGeneros.length > 0 ||
      priceRange[0] > MIN_PRICE ||
      priceRange[1] < MAX_PRICE
    );
  }, [searchQuery, selectedTipoEvento, selectedGeneros, priceRange]);

  const filteredArtistas = useMemo(() => {
    return artistas?.filter((artista) => {
      const matchesSearch =
        artista.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artista.descripcion?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artista.estilo?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGenero =
        selectedGeneros.length === 0 ||
        (artista.estilo && selectedGeneros.includes(artista.estilo));

      const matchesPrice =
        (artista.cache || 0) >= priceRange[0] &&
        (artista.cache || 0) <= priceRange[1];

      const matchesMode = isPremium
        ? !isStandardArtist(artista)
        : isStandardArtist(artista);

      return matchesSearch && matchesGenero && matchesPrice && matchesMode;
    });
  }, [artistas, searchQuery, selectedGeneros, priceRange, isPremium]);

  const sortedArtistas = useMemo(() => {
    return [...(filteredArtistas || [])].sort((a, b) => {
      switch (sortBy) {
        case "nombre":
          return a.nombre.localeCompare(b.nombre);
        case "precio-asc":
          return (a.cache || 0) - (b.cache || 0);
        case "precio-desc":
          return (b.cache || 0) - (a.cache || 0);
        default:
          return 0;
      }
    });
  }, [filteredArtistas, sortBy]);

  const handleToggleFavorito = (id: string) => {
    const artista = artistas?.find((a) => a.id === id);
    const wasFavorito = isFavorito(id);
    toggleFavorito(id);
    if (wasFavorito) {
      toast.success(`${artista?.nombre || "Artista"} eliminado de favoritos`);
    } else {
      toast.success(`${artista?.nombre || "Artista"} añadido a favoritos`);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 pt-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="font-display text-3xl font-bold">
              {isPremium ? "Artistas Premium" : "Artistas Estándar"}
            </h1>
          </div>
          <p className="mt-1 text-muted-foreground">
            Encuentra el artista perfecto para tu evento
          </p>
        </div>
        <Button variant="outline" className="rounded-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Sugerir Artista
        </Button>
      </div>


      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, estilo o descripción..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={selectedTipoEvento} onValueChange={setSelectedTipoEvento}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Tipo de evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {TIPOS_EVENTO.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre A-Z</SelectItem>
              <SelectItem value="precio-asc">Precio: menor a mayor</SelectItem>
              <SelectItem value="precio-desc">Precio: mayor a menor</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Más filtros
                {(selectedGeneros.length > 0 || priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE) && (
                  <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {selectedGeneros.length + (priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-popover border border-border shadow-lg z-50" align="end">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-3">Rango de caché</h4>
                  <Slider
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                    min={MIN_PRICE}
                    max={MAX_PRICE}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-3">Género musical</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {GENEROS.map((genero) => (
                      <div key={genero} className="flex items-center space-x-2">
                        <Checkbox
                          id={genero}
                          checked={selectedGeneros.includes(genero)}
                          onCheckedChange={() => toggleGenero(genero)}
                        />
                        <Label htmlFor={genero} className="text-sm cursor-pointer">
                          {genero}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="shrink-0"
            title="Resetear filtros"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Filtros activos:</span>

            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                Búsqueda: "{searchQuery}"
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSearchQuery("")} />
              </Badge>
            )}

            {selectedTipoEvento !== "all" && (
              <Badge variant="secondary" className="gap-1">
                {selectedTipoEvento}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTipoEvento("all")} />
              </Badge>
            )}

            {(priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE) && (
              <Badge variant="secondary" className="gap-1">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange([MIN_PRICE, MAX_PRICE])} />
              </Badge>
            )}

            {selectedGeneros.map((genero) => (
              <Badge key={genero} variant="secondary" className="gap-1">
                {genero}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleGenero(genero)} />
              </Badge>
            ))}

            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Limpiar todo
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        {sortedArtistas?.length || 0} artistas {isPremium ? "premium" : "estándar"} encontrados
      </p>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
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
      ) : !sortedArtistas?.length ? (
        <div className="text-center py-16">
          <Music className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-lg text-muted-foreground">
            No se encontraron artistas {isPremium ? "premium" : "estándar"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedArtistas.map((artista) => (
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
