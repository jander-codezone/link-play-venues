import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Building2, Save, Bell, Euro, Plus, Trash2, Music, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatNumberWithDots, parseFormattedNumber } from "@/lib/formatNumber";

interface Negocio {
  id: string;
  nombre: string;
  tipo: string | null;
  ubicacion: string | null;
  capacidad: number | null;
  descripcion: string | null;
  presupuesto_min: number | null;
  presupuesto_max: number | null;
  hora_apertura: string | null;
  hora_cierre: string | null;
  estilos_musicales: string[] | null;
  dias_apertura: string[] | null;
}

const DIAS_SEMANA = [
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const ESTILOS_MUSICALES = [
  "House", "Techno", "EDM", "Hip Hop", "R&B", "Reggaeton", 
  "Pop", "Rock", "Indie", "Jazz", "Latin", "Comercial",
  "Deep House", "Tech House", "Minimal", "Trance", "Drum & Bass"
];

function getInitials(nombre: string): string {
  return nombre
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Configuracion() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: negocios = [], isLoading } = useQuery({
    queryKey: ["negocios"],
    queryFn: async () => {
      const { data, error } = await supabase.from("negocios").select("*").order("nombre");
      if (error) throw error;
      return data as Negocio[];
    },
  });

  const [selectedNegocioId, setSelectedNegocioId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "",
    ubicacion: "",
    capacidad: "",
    descripcion: "",
    presupuesto_min: "",
    presupuesto_max: "",
    hora_apertura: "",
    hora_cierre: "",
    estilos_musicales: [] as string[],
    dias_apertura: [] as string[],
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
  });

  // Set first negocio as selected when loaded
  useEffect(() => {
    if (negocios.length > 0 && !selectedNegocioId) {
      setSelectedNegocioId(negocios[0].id);
    }
  }, [negocios, selectedNegocioId]);

  // Update form when selected negocio changes
  useEffect(() => {
    const negocio = negocios.find((n) => n.id === selectedNegocioId);
    if (negocio) {
      setFormData({
        nombre: negocio.nombre || "",
        tipo: negocio.tipo || "",
        ubicacion: negocio.ubicacion || "",
        capacidad: negocio.capacidad?.toString() || "",
        descripcion: negocio.descripcion || "",
        presupuesto_min: negocio.presupuesto_min?.toString() || "",
        presupuesto_max: negocio.presupuesto_max?.toString() || "",
        hora_apertura: negocio.hora_apertura?.slice(0, 5) || "",
        hora_cierre: negocio.hora_cierre?.slice(0, 5) || "",
        estilos_musicales: negocio.estilos_musicales || [],
        dias_apertura: negocio.dias_apertura || [],
      });
    }
  }, [selectedNegocioId, negocios]);

  const selectedNegocio = negocios.find((n) => n.id === selectedNegocioId);

  const toggleEstilo = (estilo: string) => {
    setFormData(prev => ({
      ...prev,
      estilos_musicales: prev.estilos_musicales.includes(estilo)
        ? prev.estilos_musicales.filter(e => e !== estilo)
        : [...prev.estilos_musicales, estilo]
    }));
  };

  const toggleDia = (dia: string) => {
    setFormData(prev => ({
      ...prev,
      dias_apertura: prev.dias_apertura.includes(dia)
        ? prev.dias_apertura.filter(d => d !== dia)
        : [...prev.dias_apertura, dia]
    }));
  };

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const updateData = {
        nombre: data.nombre,
        tipo: data.tipo || null,
        ubicacion: data.ubicacion || null,
        capacidad: data.capacidad ? parseInt(data.capacidad) : null,
        descripcion: data.descripcion || null,
        presupuesto_min: data.presupuesto_min ? parseFloat(data.presupuesto_min) : null,
        presupuesto_max: data.presupuesto_max ? parseFloat(data.presupuesto_max) : null,
        hora_apertura: data.hora_apertura || null,
        hora_cierre: data.hora_cierre || null,
        estilos_musicales: data.estilos_musicales.length > 0 ? data.estilos_musicales : null,
        dias_apertura: data.dias_apertura.length > 0 ? data.dias_apertura : null,
      };

      if (selectedNegocioId) {
        const { error } = await supabase
          .from("negocios")
          .update(updateData)
          .eq("id", selectedNegocioId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negocios"] });
      toast({
        title: "Configuración guardada",
        description: "Los cambios se han guardado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("negocios")
        .insert({ nombre: "Nuevo Negocio" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["negocios"] });
      setSelectedNegocioId(data.id);
      toast({
        title: "Negocio creado",
        description: "Se ha creado un nuevo negocio.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el negocio.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("negocios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negocios"] });
      setSelectedNegocioId(null);
      toast({
        title: "Negocio eliminado",
        description: "El negocio se ha eliminado correctamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el negocio.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  // Subscription management component
  const SubscriptionManagementCard = () => {
    const [isLoadingPortal, setIsLoadingPortal] = useState(false);
    const [subscription, setSubscription] = useState<{
      subscribed: boolean;
      product_id: string | null;
      subscription_end: string | null;
    } | null>(null);
    const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

    useEffect(() => {
      const checkSubscription = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (error) throw error;
          setSubscription(data);
        } catch (error) {
          console.error("Error checking subscription:", error);
        } finally {
          setIsCheckingSubscription(false);
        }
      };
      checkSubscription();
    }, []);

    const handleManageSubscription = async () => {
      setIsLoadingPortal(true);
      try {
        const { data, error } = await supabase.functions.invoke("customer-portal");
        if (error) throw error;
        if (data?.url) {
          window.open(data.url, "_blank");
        }
      } catch (error) {
        console.error("Error opening portal:", error);
        toast({
          title: "Error",
          description: "No se pudo abrir el portal de gestión.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPortal(false);
      }
    };

    const getPlanName = () => {
      if (!subscription?.product_id) return "Sin plan activo";
      if (subscription.product_id === "prod_TbmHPNNWG7saPQ") return "Plan Estándar";
      if (subscription.product_id === "prod_TbmIXsJ87Ay3UC") return "Plan Premium";
      return "Plan activo";
    };

    return (
      <Card id="suscripcion" className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2">
              <CreditCard className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="font-display">Gestión de Suscripción</CardTitle>
              <CardDescription>Administra tu plan y método de pago</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCheckingSubscription ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando suscripción...
            </div>
          ) : subscription?.subscribed ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-medium">{getPlanName()}</p>
                  <p className="text-sm text-muted-foreground">
                    Próxima renovación: {subscription.subscription_end && new Date(subscription.subscription_end).toLocaleDateString("es-ES")}
                  </p>
                </div>
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Activo</Badge>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleManageSubscription}
                disabled={isLoadingPortal}
              >
                {isLoadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gestionar suscripción (cambiar plan o cancelar)
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
              <div>
                <p className="font-medium">Sin suscripción activa</p>
                <p className="text-sm text-muted-foreground">
                  Visita la página de suscripciones para elegir un plan
                </p>
              </div>
              <Button variant="default" size="sm" asChild>
                <a href="/suscripciones">Ver planes</a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="animate-pulse">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu negocio y preferencias</p>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending}
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Negocio
        </Button>
      </div>

      {/* Business Selector */}
      {negocios.length > 0 && (
        <div className="flex items-center gap-3">
          <Label className="text-muted-foreground whitespace-nowrap">Negocio activo:</Label>
          <Select value={selectedNegocioId || ""} onValueChange={setSelectedNegocioId}>
            <SelectTrigger className="w-[280px] bg-card border-border rounded-xl">
              <SelectValue placeholder="Selecciona un negocio" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {negocios.map((negocio) => (
                <SelectItem key={negocio.id} value={negocio.id}>
                  {negocio.nombre} {negocio.tipo ? `(${negocio.tipo})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {selectedNegocio ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Profile Card */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary/10 p-2">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="font-display">Perfil del Negocio</CardTitle>
                    <CardDescription>Datos básicos de tu establecimiento</CardDescription>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar negocio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente el negocio "{selectedNegocio.nombre}" y todos sus datos asociados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate(selectedNegocio.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar and Name Preview */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 bg-primary/20 text-primary">
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                    {getInitials(formData.nombre || "NN")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{formData.nombre || "Sin nombre"}</p>
                  <p className="text-sm text-muted-foreground">{formData.ubicacion || "Sin ubicación"}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre del Negocio *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Club Example"
                    className="bg-secondary/50 border-border/50 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Negocio</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      <SelectItem value="Club / Discoteca">Club / Discoteca</SelectItem>
                      <SelectItem value="Bar">Bar</SelectItem>
                      <SelectItem value="Restaurante">Restaurante</SelectItem>
                      <SelectItem value="Hotel">Hotel</SelectItem>
                      <SelectItem value="Sala de Conciertos">Sala de Conciertos</SelectItem>
                      <SelectItem value="Otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ubicacion">Ubicación</Label>
                  <Input
                    id="ubicacion"
                    value={formData.ubicacion}
                    onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                    placeholder="Madrid, España"
                    className="bg-secondary/50 border-border/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacidad">Capacidad</Label>
                  <Input
                    id="capacidad"
                    type="text"
                    value={formData.capacidad ? formatNumberWithDots(formData.capacidad) : ""}
                    onChange={(e) => {
                      const raw = parseFormattedNumber(e.target.value);
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setFormData({ ...formData, capacidad: raw });
                      }
                    }}
                    placeholder="500"
                    className="bg-secondary/50 border-border/50 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Describe tu negocio..."
                  rows={3}
                  className="bg-secondary/50 border-border/50 rounded-xl resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Estilos Musicales Preferidos */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-2">
                  <Music className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display">Estilos Musicales Preferidos</CardTitle>
                  <CardDescription>Selecciona los géneros que encajan con tu negocio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {ESTILOS_MUSICALES.map((estilo) => (
                  <Badge
                    key={estilo}
                    variant={formData.estilos_musicales.includes(estilo) ? "default" : "outline"}
                    className={`cursor-pointer transition-all ${
                      formData.estilos_musicales.includes(estilo)
                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => toggleEstilo(estilo)}
                  >
                    {estilo}
                  </Badge>
                ))}
              </div>
              {formData.estilos_musicales.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {formData.estilos_musicales.length} estilo{formData.estilos_musicales.length !== 1 ? "s" : ""} seleccionado{formData.estilos_musicales.length !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Budget & Hours */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-accent/10 p-2">
                  <Euro className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <CardTitle className="font-display">Presupuesto Semanal y Horarios</CardTitle>
                  <CardDescription>Define el rango de presupuesto que destinas por semana a contratación de artistas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="presupuesto_min">Presupuesto Mínimo Semanal (€)</Label>
                  <Input
                    id="presupuesto_min"
                    type="text"
                    value={formData.presupuesto_min ? formatNumberWithDots(formData.presupuesto_min) : ""}
                    onChange={(e) => {
                      const raw = parseFormattedNumber(e.target.value);
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setFormData({ ...formData, presupuesto_min: raw });
                      }
                    }}
                    placeholder="500"
                    className="bg-secondary/50 border-border/50 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="presupuesto_max">Presupuesto Máximo Semanal (€)</Label>
                  <Input
                    id="presupuesto_max"
                    type="text"
                    value={formData.presupuesto_max ? formatNumberWithDots(formData.presupuesto_max) : ""}
                    onChange={(e) => {
                      const raw = parseFormattedNumber(e.target.value);
                      if (raw === "" || /^\d+$/.test(raw)) {
                        setFormData({ ...formData, presupuesto_max: raw });
                      }
                    }}
                    placeholder="5.000"
                    className="bg-secondary/50 border-border/50 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hora_apertura">Hora de Apertura</Label>
                  <Select
                    value={formData.hora_apertura}
                    onValueChange={(value) => setFormData({ ...formData, hora_apertura: value })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                      <SelectValue placeholder="Selecciona hora" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {["22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00"].map((hora) => (
                        <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hora_cierre">Hora de Cierre</Label>
                  <Select
                    value={formData.hora_cierre}
                    onValueChange={(value) => setFormData({ ...formData, hora_cierre: value })}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/50 rounded-xl">
                      <SelectValue placeholder="Selecciona hora" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border z-50">
                      {["22:00", "22:30", "23:00", "23:30", "00:00", "00:30", "01:00", "01:30", "02:00", "02:30", "03:00", "03:30", "04:00", "04:30", "05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00"].map((hora) => (
                        <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Días de Apertura */}
              <div className="space-y-3">
                <Label>Días de Apertura</Label>
                <div className="flex flex-wrap gap-2">
                  {DIAS_SEMANA.map((dia) => (
                    <Badge
                      key={dia.id}
                      variant={formData.dias_apertura.includes(dia.id) ? "default" : "outline"}
                      className={`cursor-pointer transition-all px-4 py-2 ${
                        formData.dias_apertura.includes(dia.id)
                          ? "bg-primary text-primary-foreground hover:bg-primary/80"
                          : "hover:bg-secondary"
                      }`}
                      onClick={() => toggleDia(dia.id)}
                    >
                      {dia.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <SubscriptionManagementCard />

          {/* Notifications */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-green-500/10 p-2">
                  <Bell className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <CardTitle className="font-display">Notificaciones</CardTitle>
                  <CardDescription>Configura cómo recibir alertas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-medium">Notificaciones por Email</p>
                  <p className="text-sm text-muted-foreground">
                    Recibe actualizaciones sobre tus contrataciones
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, email: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-medium">Notificaciones Push</p>
                  <p className="text-sm text-muted-foreground">
                    Alertas en tiempo real en tu navegador
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, push: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30">
                <div>
                  <p className="font-medium">Notificaciones SMS</p>
                  <p className="text-sm text-muted-foreground">
                    Mensajes de texto para eventos importantes
                  </p>
                </div>
                <Switch
                  checked={notifications.sms}
                  onCheckedChange={(checked) =>
                    setNotifications({ ...notifications, sms: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="bg-yellow-500 hover:bg-yellow-600 text-black rounded-xl px-8"
            >
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      ) : (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No hay negocios configurados</p>
            <p className="text-muted-foreground mb-4">Crea tu primer negocio para comenzar</p>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear Negocio
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
