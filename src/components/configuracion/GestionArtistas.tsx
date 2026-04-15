import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Crown, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ArtistaGestionado {
  id: string;
  nombre: string;
  estilo: string;
  categoria: "standard" | "premium";
  fotoUrl?: string;
}

interface GestionArtistasProps {
  artistas: ArtistaGestionado[];
  artistaSeleccionado: string | null;
  onSeleccionar: (artistaId: string) => void;
  onAgregar: (artista: Omit<ArtistaGestionado, "id">) => void;
  onEliminar: (artistaId: string) => void;
}

export function GestionArtistas({
  artistas,
  artistaSeleccionado,
  onSeleccionar,
  onAgregar,
  onEliminar,
}: GestionArtistasProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nuevoArtista, setNuevoArtista] = useState<{
    nombre: string;
    estilo: string;
    categoria: "standard" | "premium";
  }>({
    nombre: "",
    estilo: "",
    categoria: "premium",
  });

  const handleAgregar = () => {
    if (!nuevoArtista.nombre) return;
    onAgregar(nuevoArtista);
    setNuevoArtista({ nombre: "", estilo: "", categoria: "premium" });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">
          {artistas.length} artista{artistas.length !== 1 ? "s" : ""} gestionado{artistas.length !== 1 ? "s" : ""}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Añadir artista
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir nuevo artista</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre artístico</Label>
                <Input
                  placeholder="Ej: Ovy On The Drums"
                  value={nuevoArtista.nombre}
                  onChange={(e) => setNuevoArtista({ ...nuevoArtista, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Estilo musical</Label>
                <Input
                  placeholder="Ej: Reggaeton, Urban"
                  value={nuevoArtista.estilo}
                  onChange={(e) => setNuevoArtista({ ...nuevoArtista, estilo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select 
                  value={nuevoArtista.categoria} 
                  onValueChange={(v) => setNuevoArtista({ ...nuevoArtista, categoria: v as "standard" | "premium" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">
                      <span className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Premium
                      </span>
                    </SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAgregar} className="w-full" disabled={!nuevoArtista.nombre}>
                Añadir artista
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {artistas.map((artista) => (
          <Card
            key={artista.id}
            className={cn(
              "cursor-pointer transition-all hover:shadow-md",
              artistaSeleccionado === artista.id 
                ? "ring-2 ring-primary border-primary" 
                : "hover:border-primary/50"
            )}
            onClick={() => onSeleccionar(artista.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full",
                    artista.categoria === "premium" 
                      ? "bg-amber-500/20 text-amber-600" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {artista.categoria === "premium" ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{artista.nombre}</p>
                    <p className="text-sm text-muted-foreground">{artista.estilo || "Sin estilo definido"}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEliminar(artista.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {artista.categoria === "premium" && (
                <div className="mt-3 flex items-center gap-1">
                  <Crown className="h-3 w-3 text-amber-500" />
                  <span className="text-xs text-amber-600 font-medium">Premium</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {artistas.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No tienes artistas registrados</p>
          <p className="text-sm">Añade los artistas que representas para gestionar su disponibilidad</p>
        </div>
      )}
    </div>
  );
}
