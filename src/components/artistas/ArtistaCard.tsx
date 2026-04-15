import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ArtistaCardProps {
  id: string;
  nombre: string;
  descripcion: string;
  estilo: string;
  cachePagado: string;
  fotoUrl?: string;
  isFavorito?: boolean;
  onToggleFavorito?: (id: string) => void;
}

export function ArtistaCard({
  id,
  nombre,
  descripcion,
  estilo,
  cachePagado,
  fotoUrl,
  isFavorito = false,
  onToggleFavorito,
}: ArtistaCardProps) {
  const navigate = useNavigate();
  const imageUrl = fotoUrl || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80&seed=${encodeURIComponent(nombre)}`;

  const handleClick = () => {
    navigate(`/artistas/${id}`);
  };

  const handleFavoritoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorito?.(id);
  };
  
  return (
    <div 
      onClick={handleClick}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card overflow-hidden shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary/30 cursor-pointer animate-slide-up"
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          alt={nombre}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/20" />
      </div>

      <div className="flex-1 min-w-0 py-3">
        <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{nombre}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1">{descripcion}</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            {estilo}
          </Badge>
          <Badge variant="outline" className="text-xs text-slate-700 dark:text-slate-300">
            {cachePagado}
          </Badge>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "transition-all mr-3 hover:scale-110",
          isFavorito ? "text-pink-500" : "text-muted-foreground hover:text-pink-500"
        )}
        onClick={handleFavoritoClick}
      >
        <Heart className={cn("h-5 w-5 transition-all", isFavorito && "fill-current")} />
      </Button>
    </div>
  );
}
