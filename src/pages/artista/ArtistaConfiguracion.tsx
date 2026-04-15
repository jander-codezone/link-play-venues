import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, DollarSign, Calendar, Clock, Loader2, Users, Crown, Building, CreditCard, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DisponibilidadSemanal, DisponibilidadSemanalData } from "@/components/configuracion/DisponibilidadSemanal";
import { ExcepcionesDisponibilidad, ExcepcionFecha } from "@/components/configuracion/ExcepcionesDisponibilidad";
import { DisponibilidadPremium, DisponibilidadPremiumItem } from "@/components/configuracion/DisponibilidadPremium";
import { GestionArtistas, ArtistaGestionado } from "@/components/configuracion/GestionArtistas";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  getTiersForUserType, 
  getTierByProductId, 
  type UserType 
} from "@/lib/subscription-tiers";

const estilosMusicales = [
  "House", "Techno", "Tech House", "Minimal", "Deep House", 
  "Progressive", "Trance", "Drum & Bass", "Dubstep", "Hip Hop",
  "R&B", "Pop", "Rock", "Jazz", "Electrónica", "Reggaeton", "Latino"
];

const tiposArtista = [
  "DJ", "Productor", "DJ/Productor", "Cantante", "Banda", "Solista", "Grupo"
];

const disponibilidadInicial: DisponibilidadSemanalData = {
  lunes: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  martes: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  miercoles: { activo: false, horaInicio: "21:00", horaFin: "06:00" },
  jueves: { activo: false, horaInicio: "22:00", horaFin: "04:00" },
  viernes: { activo: false, horaInicio: "23:00", horaFin: "06:00" },
  sabado: { activo: false, horaInicio: "23:00", horaFin: "07:00" },
  domingo: { activo: false, horaInicio: "21:00", horaFin: "03:00" },
};

type TipoUsuario = "artista" | "representante" | "venue";

export default function ArtistaConfiguracion() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoUsuario, setTipoUsuario] = useState<TipoUsuario>("artista");
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "general");
  
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);
  
  const [artistaId, setArtistaId] = useState<string | null>(null);
  const [perfil, setPerfil] = useState({
    nombre: "", tipoArtista: "", estiloMusical: "", descripcion: "", cacheMin: "", cacheMax: "", email: "",
  });
  const [disponibilidadSemanal, setDisponibilidadSemanal] = useState<DisponibilidadSemanalData>(disponibilidadInicial);
  const [excepciones, setExcepciones] = useState<ExcepcionFecha[]>([]);

  const [artistasGestionados, setArtistasGestionados] = useState<ArtistaGestionado[]>([]);
  const [artistaSeleccionado, setArtistaSeleccionado] = useState<string | null>(null);
  const [disponibilidadPremium, setDisponibilidadPremium] = useState<DisponibilidadPremiumItem[]>([]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        let { data: perfilData } = await supabase
          .from("perfiles")
          .select("*")
          .limit(1)
          .maybeSingle();

        if (!perfilData) {
          const { data: nuevoPerfil, error } = await supabase
            .from("perfiles")
            .insert({ nombre: "Mi Perfil", tipo_usuario: "artista" })
            .select()
            .single();
          if (error) throw error;
          perfilData = nuevoPerfil;
        }

        setPerfilId(perfilData.id);
        setTipoUsuario(perfilData.tipo_usuario as TipoUsuario);

        if (perfilData.tipo_usuario === "artista" || perfilData.tipo_usuario === "artista_individual") {
          let { data: artista } = await supabase
            .from("artistas")
            .select("*")
            .eq("perfil_artista_id", perfilData.id)
            .maybeSingle();

          if (!artista) {
            const { data: artistaSinPerfil } = await supabase
              .from("artistas")
              .select("*")
              .is("perfil_artista_id", null)
              .is("representante_id", null)
              .limit(1)
              .maybeSingle();

            if (artistaSinPerfil) {
              await supabase.from("artistas").update({ perfil_artista_id: perfilData.id }).eq("id", artistaSinPerfil.id);
              artista = artistaSinPerfil;
            } else {
              const { data: nuevoArtista, error } = await supabase
                .from("artistas")
                .insert({ nombre: perfilData.nombre || "Mi Perfil", perfil_artista_id: perfilData.id, categoria: "standard" })
                .select()
                .single();
              if (error) throw error;
              artista = nuevoArtista;
            }
          }

          if (artista) {
            setArtistaId(artista.id);
            setPerfil({
              nombre: artista.nombre || "", tipoArtista: artista.tipos_evento?.[0] || "",
              estiloMusical: artista.estilo || "", descripcion: artista.descripcion || "",
              cacheMin: artista.cache?.toString() || "", cacheMax: "", email: artista.email || "",
            });

            const { data: disponibilidadData } = await supabase
              .from("artista_disponibilidad_semanal")
              .select("*")
              .eq("artista_id", artista.id);

            if (disponibilidadData && disponibilidadData.length > 0) {
              const nuevaDisponibilidad = { ...disponibilidadInicial };
              disponibilidadData.forEach((d) => {
                nuevaDisponibilidad[d.dia_semana] = {
                  activo: d.activo || false,
                  horaInicio: d.hora_inicio?.slice(0, 5) || "21:00",
                  horaFin: d.hora_fin?.slice(0, 5) || "06:00",
                };
              });
              setDisponibilidadSemanal(nuevaDisponibilidad);
            }

            const { data: excepcionesData } = await supabase
              .from("artista_disponibilidad")
              .select("*")
              .eq("artista_id", artista.id);

            if (excepcionesData) {
              setExcepciones(excepcionesData.map((e) => ({
                id: e.id, fecha: new Date(e.fecha), disponible: e.disponible || false,
                horaInicio: e.hora_inicio?.slice(0, 5), horaFin: e.hora_fin?.slice(0, 5),
                motivo: e.motivo || e.notas || "",
              })));
            }
          }
        } else {
          const { data: artistasData } = await supabase
            .from("artistas")
            .select("*")
            .eq("representante_id", perfilData.id);

          if (artistasData) {
            setArtistasGestionados(artistasData.map((a) => ({
              id: a.id, nombre: a.nombre, estilo: a.estilo || "",
              categoria: (a.categoria as "standard" | "premium") || "premium",
            })));
            if (artistasData.length > 0) {
              setArtistaSeleccionado(artistasData[0].id);
              await cargarDisponibilidadPremium(artistasData[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar la configuración");
      } finally {
        setLoading(false);
      }
    };

    const cargarSuscripcion = async () => {
      try {
        setSubscriptionLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setSubscriptionLoading(false); return; }
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        setSubscription(data);
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    cargarDatos();
    cargarSuscripcion();
  }, []);

  const cargarDisponibilidadPremium = async (artistaId: string) => {
    const { data } = await supabase.from("artista_disponibilidad_premium").select("*").eq("artista_id", artistaId);
    if (data) {
      setDisponibilidadPremium(data.map((d) => ({
        id: d.id, fecha: new Date(d.fecha), ciudad: d.ciudad, pais: d.pais || "España",
        cacheEspecial: d.cache_especial?.toString() || "", disponible: d.disponible || true,
        notas: d.notas || "", horaInicio: d.hora_inicio || "", horaFin: d.hora_fin || "",
      })));
    } else {
      setDisponibilidadPremium([]);
    }
  };

  const handleSeleccionarArtista = async (id: string) => {
    setArtistaSeleccionado(id);
    await cargarDisponibilidadPremium(id);
  };

  const handleAgregarArtista = async (artista: Omit<ArtistaGestionado, "id">) => {
    if (!perfilId) return;
    const { data, error } = await supabase
      .from("artistas")
      .insert({ nombre: artista.nombre, estilo: artista.estilo, categoria: artista.categoria, representante_id: perfilId })
      .select()
      .single();
    if (error) { toast.error("Error al añadir artista"); return; }
    setArtistasGestionados([...artistasGestionados, { id: data.id, nombre: data.nombre, estilo: data.estilo || "", categoria: data.categoria as "standard" | "premium" }]);
    setArtistaSeleccionado(data.id);
    setDisponibilidadPremium([]);
    toast.success("Artista añadido correctamente");
  };

  const handleEliminarArtista = async (id: string) => {
    const { error } = await supabase.from("artistas").delete().eq("id", id);
    if (error) { toast.error("Error al eliminar artista"); return; }
    setArtistasGestionados(artistasGestionados.filter((a) => a.id !== id));
    if (artistaSeleccionado === id) {
      const remaining = artistasGestionados.filter((a) => a.id !== id);
      setArtistaSeleccionado(remaining.length > 0 ? remaining[0].id : null);
    }
    toast.success("Artista eliminado");
  };

  const handleCambiarTipoUsuario = async (tipo: TipoUsuario) => {
    if (!perfilId) { toast.error("No hay perfil cargado"); return; }
    const { error } = await supabase.from("perfiles").update({ tipo_usuario: tipo }).eq("id", perfilId);
    if (error) { toast.error("Error al cambiar tipo de cuenta: " + error.message); return; }
    setTipoUsuario(tipo);
    toast.success("Tipo de cuenta actualizado");
    window.location.reload();
  };

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true);
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (error) {
      console.error("Error opening portal:", error);
      toast.error("No se pudo abrir el portal de gestión.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setPerfil(prev => ({ ...prev, [field]: value }));
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      if ((tipoUsuario === "artista" || tipoUsuario === ("artista_individual" as TipoUsuario)) && artistaId) {
        await supabase.from("artistas").update({
          nombre: perfil.nombre, email: perfil.email, estilo: perfil.estiloMusical,
          descripcion: perfil.descripcion, cache: perfil.cacheMin ? parseFloat(perfil.cacheMin) : null,
          tipos_evento: perfil.tipoArtista ? [perfil.tipoArtista] : null,
        }).eq("id", artistaId);

        const diasSemana = Object.entries(disponibilidadSemanal);
        for (const [dia, config] of diasSemana) {
          await supabase.from("artista_disponibilidad_semanal").upsert({
            artista_id: artistaId, dia_semana: dia, activo: config.activo,
            hora_inicio: config.horaInicio, hora_fin: config.horaFin,
          }, { onConflict: "artista_id,dia_semana" });
        }

        await supabase.from("artista_disponibilidad").delete().eq("artista_id", artistaId);
        if (excepciones.length > 0) {
          await supabase.from("artista_disponibilidad").insert(
            excepciones.map((e) => ({
              artista_id: artistaId, fecha: format(e.fecha, 'yyyy-MM-dd'),
              disponible: e.disponible, hora_inicio: e.disponible ? e.horaInicio : null,
              hora_fin: e.disponible ? e.horaFin : null, motivo: e.motivo, notas: e.motivo,
            }))
          );
        }
      } else if (tipoUsuario === "representante" && artistaSeleccionado) {
        await supabase.from("artista_disponibilidad_premium").delete().eq("artista_id", artistaSeleccionado);
        if (disponibilidadPremium.length > 0) {
          await supabase.from("artista_disponibilidad_premium").insert(
            disponibilidadPremium.map((d) => ({
              artista_id: artistaSeleccionado, fecha: format(d.fecha, 'yyyy-MM-dd'),
              ciudad: d.ciudad, pais: d.pais, cache_especial: d.cacheEspecial ? parseFloat(d.cacheEspecial) : null,
              disponible: d.disponible, notas: d.notas, hora_inicio: d.horaInicio || null, hora_fin: d.horaFin || null,
            }))
          );
        }
      }
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error("Error guardando:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const artistaSeleccionadoData = artistasGestionados.find((a) => a.id === artistaSeleccionado);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Settings className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold">Centro de Configuración</h3>
          <p className="text-sm text-muted-foreground">Personaliza los parámetros del sistema</p>
        </div>
      </div>

      {/* Tipo de Cuenta */}
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Tipo de Cuenta</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <button onClick={() => handleCambiarTipoUsuario("artista")} className={cn("p-4 rounded-lg border-2 text-left transition-all", tipoUsuario === "artista" || tipoUsuario === ("artista_individual" as TipoUsuario) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50")}>
              <div className="flex items-center gap-3 mb-2"><User className="h-5 w-5 text-primary" /><span className="font-medium">Artista Individual</span></div>
              <p className="text-sm text-muted-foreground">Gestiona tu propia agenda y disponibilidad</p>
            </button>
            <button onClick={() => handleCambiarTipoUsuario("representante")} className={cn("p-4 rounded-lg border-2 text-left transition-all", tipoUsuario === "representante" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50")}>
              <div className="flex items-center gap-3 mb-2"><Users className="h-5 w-5 text-amber-500" /><span className="font-medium">Representante</span><Crown className="h-4 w-4 text-amber-500" /></div>
              <p className="text-sm text-muted-foreground">Gestiona múltiples artistas Premium</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {tipoUsuario === "artista" || tipoUsuario === "venue" ? (
        <>
          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
                <CardTitle className="text-lg">Perfil del Artista</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="nombre">Nombre artístico</Label><Input id="nombre" placeholder="Tu nombre artístico" value={perfil.nombre} onChange={(e) => handleChange("nombre", e.target.value)} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email de contacto</Label><Input id="email" type="email" placeholder="email@ejemplo.com" value={perfil.email} onChange={(e) => handleChange("email", e.target.value)} /></div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Tipo de artista</Label><Select value={perfil.tipoArtista} onValueChange={(v) => handleChange("tipoArtista", v)}><SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger><SelectContent>{tiposArtista.map((tipo) => <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Estilo musical</Label><Select value={perfil.estiloMusical} onValueChange={(v) => handleChange("estiloMusical", v)}><SelectTrigger><SelectValue placeholder="Selecciona estilo" /></SelectTrigger><SelectContent>{estilosMusicales.map((estilo) => <SelectItem key={estilo} value={estilo}>{estilo}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label>Descripción / Bio</Label><Textarea placeholder="Cuéntanos sobre ti y tu música..." value={perfil.descripcion} onChange={(e) => handleChange("descripcion", e.target.value)} rows={3} /></div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><DollarSign className="h-5 w-5 text-emerald-500" /></div><CardTitle className="text-lg">Rangos de Caché</CardTitle></div></CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label>Caché mínimo (€)</Label><Input type="number" placeholder="500" value={perfil.cacheMin} onChange={(e) => handleChange("cacheMin", e.target.value)} /></div>
                <div className="space-y-2"><Label>Caché máximo (€)</Label><Input type="number" placeholder="2000" value={perfil.cacheMax} onChange={(e) => handleChange("cacheMax", e.target.value)} /></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">Define tu rango de precios para que los locales puedan encontrarte según su presupuesto.</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10"><Clock className="h-5 w-5 text-blue-500" /></div><div><CardTitle className="text-lg">Disponibilidad Semanal</CardTitle><p className="text-sm text-muted-foreground mt-1">Configura tu horario habitual de disponibilidad</p></div></div></CardHeader>
            <CardContent><DisponibilidadSemanal disponibilidad={disponibilidadSemanal} onChange={setDisponibilidadSemanal} /></CardContent>
          </Card>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10"><Calendar className="h-5 w-5 text-amber-500" /></div><div><CardTitle className="text-lg">Excepciones de Disponibilidad</CardTitle><p className="text-sm text-muted-foreground mt-1">Añade fechas específicas donde tu disponibilidad sea diferente</p></div></div></CardHeader>
            <CardContent><ExcepcionesDisponibilidad excepciones={excepciones} onChange={setExcepciones} /></CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card className="border shadow-sm">
            <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10"><Crown className="h-5 w-5 text-amber-500" /></div><CardTitle className="text-lg">Artistas Representados</CardTitle></div></CardHeader>
            <CardContent><GestionArtistas artistas={artistasGestionados} artistaSeleccionado={artistaSeleccionado} onSeleccionar={handleSeleccionarArtista} onAgregar={handleAgregarArtista} onEliminar={handleEliminarArtista} /></CardContent>
          </Card>

          {artistaSeleccionado && artistaSeleccionadoData && (
            <Card className="border shadow-sm">
              <CardHeader className="pb-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10"><Calendar className="h-5 w-5 text-emerald-500" /></div><div><CardTitle className="text-lg">Disponibilidad de {artistaSeleccionadoData.nombre}</CardTitle><p className="text-sm text-muted-foreground mt-1">Indica las fechas, ciudades y caché especial</p></div></div></CardHeader>
              <CardContent><DisponibilidadPremium disponibilidad={disponibilidadPremium} onChange={setDisponibilidadPremium} /></CardContent>
            </Card>
          )}
        </>
      )}

      {/* Suscripción */}
      <Card className="border shadow-sm" id="suscripcion">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-500/10"><CreditCard className="h-5 w-5 text-yellow-500" /></div>
            <div><CardTitle className="text-lg">Gestión de Suscripción</CardTitle><CardDescription>Administra tu plan y método de pago</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : subscription?.subscribed ? (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div>
                  <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /><span className="font-semibold">{subscription.product_id ? getTierByProductId(subscription.product_id)?.tier === "premium" ? "Plan Premium" : "Plan Estándar" : "Plan Activo"}</span><Badge variant="default" className="ml-2">Activa</Badge></div>
                  <p className="text-sm text-muted-foreground mt-1">Próxima renovación: {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString("es-ES") : "N/A"}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" onClick={handleManageSubscription} disabled={portalLoading} className="flex-1">{portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ExternalLink className="h-4 w-4 mr-2" />}Cambiar plan o método de pago</Button>
                <Button variant="destructive" onClick={handleManageSubscription} disabled={portalLoading}>Cancelar suscripción</Button>
              </div>
              <p className="text-xs text-muted-foreground">Serás redirigido al portal seguro de Stripe.</p>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">No tienes una suscripción activa.</p>
              <Button asChild><a href="/suscripciones">Ver planes disponibles</a></Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGuardar} className="px-8" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
