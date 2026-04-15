import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus, Trash2, MapPin, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const paises = [
  "España", "Alemania", "Andorra", "Argentina", "Australia", "Austria", "Bélgica", "Bolivia", 
  "Brasil", "Canadá", "Chile", "China", "Colombia", "Corea del Sur", "Costa Rica", "Croacia",
  "Cuba", "Dinamarca", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eslovaquia",
  "Eslovenia", "Estados Unidos", "Estonia", "Filipinas", "Finlandia", "Francia", "Grecia", 
  "Guatemala", "Honduras", "Hong Kong", "Hungría", "India", "Indonesia", "Irlanda", "Islandia",
  "Israel", "Italia", "Japón", "Letonia", "Lituania", "Luxemburgo", "Malasia", "Malta", "Marruecos",
  "México", "Mónaco", "Nicaragua", "Nigeria", "Noruega", "Nueva Zelanda", "Países Bajos", "Panamá",
  "Paraguay", "Perú", "Polonia", "Portugal", "Puerto Rico", "Qatar", "Reino Unido", "República Checa",
  "República Dominicana", "Rumanía", "Rusia", "Singapur", "Sudáfrica", "Suecia", "Suiza", "Tailandia",
  "Taiwán", "Turquía", "Ucrania", "Uruguay", "Venezuela", "Vietnam"
];

const ciudadesPorPais: Record<string, string[]> = {
  "España": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Murcia", "Palma de Mallorca", "Las Palmas", "Bilbao", "Alicante", "Córdoba", "Valladolid", "Vigo", "Gijón", "Granada", "A Coruña", "Vitoria", "Santa Cruz de Tenerife", "Pamplona", "San Sebastián", "Santander", "Burgos", "Salamanca", "Ibiza"],
  "Alemania": ["Berlín", "Múnich", "Hamburgo", "Frankfurt", "Colonia", "Düsseldorf", "Stuttgart", "Leipzig"],
  "Francia": ["París", "Marsella", "Lyon", "Toulouse", "Niza", "Burdeos"],
  "Italia": ["Roma", "Milán", "Nápoles", "Turín", "Florencia", "Venecia"],
  "Reino Unido": ["Londres", "Manchester", "Birmingham", "Liverpool", "Glasgow", "Edimburgo"],
  "Estados Unidos": ["Miami", "Nueva York", "Los Ángeles", "Chicago", "Houston", "Las Vegas", "San Francisco", "Boston", "Washington D.C.", "Atlanta", "Dallas", "Denver", "Seattle", "Orlando", "San Diego"],
  "México": ["Ciudad de México", "Guadalajara", "Monterrey", "Cancún", "Tijuana", "Puebla", "León", "Mérida"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Mar del Plata", "La Plata"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena"],
  "Brasil": ["São Paulo", "Río de Janeiro", "Brasilia", "Salvador", "Fortaleza", "Belo Horizonte"],
  "Portugal": ["Lisboa", "Oporto", "Faro", "Braga"],
  "Países Bajos": ["Ámsterdam", "Róterdam", "La Haya", "Utrecht"],
};

const horas = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30",
  "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30",
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"
];

export interface DisponibilidadPremiumItem {
  id: string;
  fecha: Date;
  ciudad: string;
  pais: string;
  cacheEspecial: string;
  disponible: boolean;
  notas: string;
  horaInicio: string;
  horaFin: string;
}

interface DisponibilidadPremiumProps {
  disponibilidad: DisponibilidadPremiumItem[];
  onChange: (disponibilidad: DisponibilidadPremiumItem[]) => void;
}

export function DisponibilidadPremium({ disponibilidad, onChange }: DisponibilidadPremiumProps) {
  const [nuevaDisp, setNuevaDisp] = useState<Partial<DisponibilidadPremiumItem>>({
    pais: "España",
    disponible: true,
    cacheEspecial: "",
    notas: "",
    horaInicio: "",
    horaFin: "",
  });
  const [fechaOpen, setFechaOpen] = useState(false);

  const ciudades = ciudadesPorPais[nuevaDisp.pais || "España"] || [];

  const handleAgregar = () => {
    if (!nuevaDisp.fecha || !nuevaDisp.ciudad) return;
    
    const nueva: DisponibilidadPremiumItem = {
      id: crypto.randomUUID(),
      fecha: nuevaDisp.fecha,
      ciudad: nuevaDisp.ciudad,
      pais: nuevaDisp.pais || "España",
      cacheEspecial: nuevaDisp.cacheEspecial || "",
      disponible: true,
      notas: nuevaDisp.notas || "",
      horaInicio: nuevaDisp.horaInicio || "",
      horaFin: nuevaDisp.horaFin || "",
    };
    
    onChange([...disponibilidad, nueva]);
    setNuevaDisp({
      pais: "España",
      disponible: true,
      cacheEspecial: "",
      notas: "",
      horaInicio: "",
      horaFin: "",
    });
  };

  const handleEliminar = (id: string) => {
    onChange(disponibilidad.filter((d) => d.id !== id));
  };

  const disponibilidadPorMes = disponibilidad.reduce((acc, item) => {
    const mes = format(item.fecha, "MMMM yyyy", { locale: es });
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(item);
    return acc;
  }, {} as Record<string, DisponibilidadPremiumItem[]>);

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-lg border border-dashed border-muted-foreground/30 space-y-4">
        <p className="text-sm font-medium">Añadir disponibilidad</p>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Popover open={fechaOpen} onOpenChange={setFechaOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !nuevaDisp.fecha && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {nuevaDisp.fecha ? (
                    format(nuevaDisp.fecha, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={nuevaDisp.fecha}
                  onSelect={(date) => {
                    setNuevaDisp({ ...nuevaDisp, fecha: date });
                    setFechaOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                  locale={es}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-2">
            <Label>País</Label>
            <Select 
              value={nuevaDisp.pais} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, pais: v, ciudad: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {paises.map((pais) => (
                  <SelectItem key={pais} value={pais}>{pais}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Ciudad</Label>
            <Select 
              value={nuevaDisp.ciudad} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, ciudad: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar ciudad" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {ciudades.length > 0 ? (
                  ciudades.map((ciudad) => (
                    <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                  ))
                ) : (
                  <SelectItem value="otra" disabled>No hay ciudades para este país</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Caché especial (€)</Label>
            <Input
              type="number"
              placeholder="Ej: 15000"
              value={nuevaDisp.cacheEspecial || ""}
              onChange={(e) => setNuevaDisp({ ...nuevaDisp, cacheEspecial: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Hora inicio (aprox.)</Label>
            <Select 
              value={nuevaDisp.horaInicio || ""} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, horaInicio: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {horas.map((hora) => (
                  <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hora fin (aprox.)</Label>
            <Select 
              value={nuevaDisp.horaFin || ""} 
              onValueChange={(v) => setNuevaDisp({ ...nuevaDisp, horaFin: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar hora" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {horas.map((hora) => (
                  <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAgregar} 
          disabled={!nuevaDisp.fecha || !nuevaDisp.ciudad}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Añadir disponibilidad
        </Button>
      </div>

      {Object.keys(disponibilidadPorMes).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(disponibilidadPorMes)
            .sort(([a], [b]) => {
              const dateA = new Date(disponibilidadPorMes[a][0].fecha);
              const dateB = new Date(disponibilidadPorMes[b][0].fecha);
              return dateA.getTime() - dateB.getTime();
            })
            .map(([mes, items]) => (
              <div key={mes}>
                <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">{mes}</p>
                <div className="space-y-2">
                  {items
                    .sort((a, b) => a.fecha.getTime() - b.fecha.getTime())
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {format(item.fecha, "EEEE d", { locale: es })}
                            </span>
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {item.ciudad}, {item.pais}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            {item.horaInicio && (
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {item.horaInicio}{item.horaFin && ` - ${item.horaFin}`}
                              </span>
                            )}
                            {item.cacheEspecial && (
                              <span className="text-sm text-emerald-600 font-medium">
                                Caché: {parseInt(item.cacheEspecial).toLocaleString("es-ES")}€
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEliminar(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No hay fechas de disponibilidad configuradas. Añade las ciudades y fechas donde el artista estará disponible.
        </p>
      )}
    </div>
  );
}
