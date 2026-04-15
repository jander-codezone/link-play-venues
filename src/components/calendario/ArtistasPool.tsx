import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Artista {
  id: string;
  nombre: string;
  foto_url?: string | null;
}

interface ArtistasPoolProps {
  artistas: Artista[];
  onDragStart: (artista: Artista) => void;
}

export function ArtistasPool({
  artistas,
  onDragStart
}: ArtistasPoolProps) {
  const handleDragStart = (e: React.DragEvent, artista: Artista) => {
    e.dataTransfer.setData("artista", JSON.stringify(artista));
    e.dataTransfer.effectAllowed = "move";
    onDragStart(artista);
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-card p-4">
      <h3 className="font-display font-semibold text-foreground mb-4">
        Artistas favoritos
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Arrastra un artista al calendario para programar una contratación
      </p>
      <div className="flex flex-wrap gap-3">
        {artistas.map(artista => (
          <div
            key={artista.id}
            draggable
            onDragStart={e => handleDragStart(e, artista)}
            className={cn(
              "flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm font-medium text-foreground",
              "cursor-grab active:cursor-grabbing transition-all hover:scale-105 hover:shadow-md hover:bg-muted select-none"
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={artista.foto_url || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&seed=${encodeURIComponent(artista.nombre)}`} 
              />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {artista.nombre.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {artista.nombre}
          </div>
        ))}
      </div>
    </div>
  );
}
