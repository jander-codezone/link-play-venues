import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Heart,
  Music,
  Euro,
  CalendarDays,
  Clock,
  MapPin,
  Mail,
  Send,
  Percent,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoritos } from "@/hooks/useFavoritos";
import { getArtistPriceRangeDisplay, getArtistCategoryLabel, ArtistaPriceable } from "@/lib/artistaUtils";
import { formatNumberWithDots } from "@/lib/formatNumber";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const DEMO_VENUE_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

export default function ArtistaDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorito, toggleFavorito } = useFavoritos();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [solicitudOpen, setSolicitudOpen] = useState(false);
  const [availabilityRequestOpen, setAvailabilityRequestOpen] = useState(false);
  const [formData, setFormData] = useState({
    fecha: "",
    importe: "",
    hora: "",
    showType: "concierto" as "showcase" | "concierto",
    durationMinutes: "60",
    depositPercent: "50" as "25" | "50" | "100",
    ubicacion: "",
    notas: "",
  });

  const { data: artista, isLoading } = useQuery({
    queryKey: ["artista", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artistas")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: bookingPreferences } = useQuery({
    queryKey: ["artist-booking-preferences", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artist_booking_preferences")
        .select("*")
        .eq("artist_id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: disponibilidadPremium } = useQuery({
    queryKey: ["artista-disponibilidad-premium", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artista_disponibilidad_premium")
        .select("*")
        .eq("artista_id", id)
        .eq("disponible", true)
        .gte("fecha", new Date().toISOString().split("T")[0])
        .order("fecha", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: disponibilidadSemanal } = useQuery({
    queryKey: ["artista-disponibilidad-semanal", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("artista_disponibilidad_semanal")
        .select("*")
        .eq("artista_id", id);
      return data || [];
    },
    enabled: !!id,
  });

  const getDurationOptions = (showType: string) => {
    if (showType === "showcase") return [15, 20, 25, 30];
    return [60, 75, 90];
  };

  const getPriceHint = (
    artistaData: typeof artista,
    bookingPrefs: typeof bookingPreferences,
    showType: string
  ): { label: string; minPrice: number; maxPrice: number } | null => {
    if (!artistaData) return null;

    // Prefer artista.cache_min / cache_max (added via migration)
    const rawMin = (artistaData as Record<string, unknown>).cache_min;
    const rawMax = (artistaData as Record<string, unknown>).cache_max;
    const cacheMin = typeof rawMin === "number" && rawMin > 0 ? rawMin : null;
    const cacheMax = typeof rawMax === "number" && rawMax > 0 ? rawMax : null;

    let resolvedMin: number | null = cacheMin;
    let resolvedMax: number | null = cacheMax;

    // Fallback: bookingPreferences.cache_min / cache_max
    if (!resolvedMin && bookingPrefs?.cache_min && bookingPrefs.cache_min > 0) {
      resolvedMin = bookingPrefs.cache_min;
    }
    if (!resolvedMax && bookingPrefs?.cache_max && bookingPrefs.cache_max > 0) {
      resolvedMax = bookingPrefs.cache_max;
    }

    // Fallback: single artista.cache
    const singleCache =
      typeof artistaData.cache === "number" && artistaData.cache > 0
        ? artistaData.cache
        : null;

    if (resolvedMin && resolvedMax) {
      if (showType === "showcase") {
        return {
          label: "Showcase",
          minPrice: Math.round(resolvedMin * 0.75),
          maxPrice: resolvedMin,
        };
      }
      return {
        label: "Concierto",
        minPrice: Math.round((resolvedMin + resolvedMax) / 2),
        maxPrice: resolvedMax,
      };
    }

    if (singleCache) {
      if (showType === "showcase") {
        return {
          label: "Showcase",
          minPrice: Math.round(singleCache * 0.5),
          maxPrice: Math.round(singleCache * 0.67),
        };
      }
      return {
        label: "Concierto",
        minPrice: singleCache,
        maxPrice: Math.round(singleCache * 1.33),
      };
    }

    return null;
  };

  const resetFormData = () => {
    setFormData({
      fecha: "",
      importe: "",
      hora: "",
      showType: "concierto",
      durationMinutes: "60",
      depositPercent: "50",
      ubicacion: "",
      notas: "",
    });
  };

  const evaluatePriceQuality = (
    price: number,
    min: number,
    max: number
  ): { level: "good" | "warning" | "bad"; message: string } => {
    if (!price || !min || !max) return { level: "good", message: "" };

    if (price >= min && price <= max) {
      return { level: "good", message: "Precio dentro del rango habitual" };
    }

    const lowerBound = min * 0.8;
    const upperBound = max * 1.2;

    if (price >= lowerBound && price <= upperBound) {
      return { level: "warning", message: "Precio ligeramente fuera del rango recomendado" };
    }

    return { level: "bad", message: "Precio muy alejado del rango habitual" };
  };

  const handleSolicitud = async (options?: {
    fixedDate?: string;
    fixedHour?: string;
    fixedLocation?: string;
    fixedDurationMinutes?: string;
    fixedShowType?: "showcase" | "concierto";
    minimumAvailabilityFee?: number;
  }) => {
    const effectiveDate = options?.fixedDate || (selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");

    if (!effectiveDate) {
      toast.error("Selecciona una fecha para la actuación");
      return;
    }

    if (
      !formData.importe ||
      !formData.hora ||
      !formData.ubicacion ||
      !formData.showType ||
      !formData.durationMinutes ||
      !formData.depositPercent
    ) {
      toast.error("Completa todos los detalles para enviar la oferta");
      return;
    }

    if (!artista || !id) {
      toast.error("No se ha podido identificar el artista");
      return;
    }

    const bookingFlowLevel = Number(artista.booking_flow_level || 1);
    const dealType =
      bookingFlowLevel >= 3
        ? "premium"
        : bookingFlowLevel === 2
          ? "structured"
          : "standard";

    const importeOferta = Number(formData.importe);
    const duracionMinutos = Number(formData.durationMinutes);
    const adelantoPropuesto = Number(formData.depositPercent);

    if (
      options?.minimumAvailabilityFee &&
      Number.isFinite(options.minimumAvailabilityFee) &&
      importeOferta < options.minimumAvailabilityFee
    ) {
      toast.error(
        `La oferta debe ser igual o superior a ${formatNumberWithDots(Number(options.minimumAvailabilityFee).toString())}€`
      );
      return;
    }

    const effectiveHour = options?.fixedHour || formData.hora;
    const effectiveLocation = options?.fixedLocation || formData.ubicacion;
    const effectiveDurationMinutes = Number(options?.fixedDurationMinutes || formData.durationMinutes);
    const effectiveShowType = options?.fixedShowType || formData.showType;

    if (!Number.isFinite(importeOferta) || importeOferta <= 0) {
      toast.error("Introduce un importe válido para la oferta");
      return;
    }

    const venueProfileId =
      localStorage.getItem("venue_profile_id_demo") || DEMO_VENUE_PROFILE_ID;
    const venueName = localStorage.getItem("venue_name_demo") || "Opium Madrid";

    const { data: dealData, error: dealError } = await supabase
      .from("booking_deals")
      .insert({
        venue_profile_id: venueProfileId,
        artist_id: id,
        artist_profile_id: artista.perfil_artista_id || null,
        representative_profile_id: artista.representante_id || null,
        deal_type: dealType,
        current_status: "offer_sent",
        current_offer_version: 1,
        event_date: effectiveDate,
        event_start_time: effectiveHour,
        duration_minutes: effectiveDurationMinutes,
        venue_name: venueName,
        city: effectiveLocation,
        country: "España",
        event_type: effectiveShowType,
        currency: "EUR",
        total_fee: importeOferta,
        commission_percent: artista.commission_percent_default || 0,
        deposit_percent: adelantoPropuesto,
        notes: formData.notas,
      })
      .select("id")
      .single();

    if (dealError || !dealData) {
      console.error("Error creando booking_deals:", dealError);
      toast.error(
        dealError?.message
          ? `No se pudo crear el deal: ${dealError.message}`
          : "No se pudo crear el deal de contratación"
      );
      return;
    }

    const { data: offerData, error: offerError } = await supabase
      .from("booking_offers")
      .insert({
        booking_deal_id: dealData.id,
        version: 1,
        created_by_profile_id: venueProfileId,
        created_by_role: "venue",
        offer_amount: importeOferta,
        currency: bookingPreferences?.currency || "EUR",
        tax_mode: bookingPreferences?.tax_mode || "plus_vat",
        vat_percent: bookingPreferences?.vat_percent || 21,
        deposit_percent_requested: adelantoPropuesto,
        deposit_percent_min: bookingPreferences?.deposit_percent_min || null,
        message: formData.notas,
        additional_terms: `Hora: ${effectiveHour} · Duración: ${effectiveDurationMinutes} min · Tipo: ${effectiveShowType} · Ubicación: ${effectiveLocation}`,
        notes: `${formData.notas} · Hora: ${effectiveHour} · Duración: ${effectiveDurationMinutes} min · Tipo: ${effectiveShowType} · Ubicación: ${effectiveLocation}`,
        is_counter_offer: false,
        status: "active",
      })
      .select("id")
      .single();

    if (offerError || !offerData) {
      console.error("Error creando booking_offers:", offerError);
      toast.error(
        offerError?.message
          ? `No se pudo crear la oferta: ${offerError.message}`
          : "No se pudo crear la oferta inicial"
      );
      return;
    }

    const { error: updateDealError } = await supabase
      .from("booking_deals")
      .update({ latest_offer_id: offerData.id })
      .eq("id", dealData.id);

    if (updateDealError) {
      toast.error("El deal se creó, pero no se pudo vincular la oferta");
      return;
    }

    toast.success("Oferta enviada correctamente");
    setSolicitudOpen(false);
    setAvailabilityRequestOpen(false);
    setSelectedDate(undefined);
    resetFormData();
  };


  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6 pt-2">
        <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-secondary rounded-xl animate-pulse" />
            <div className="h-40 bg-secondary rounded-xl animate-pulse" />
          </div>
          <div className="h-96 bg-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!artista) {
    return (
      <div className="text-center py-20">
        <Music className="mx-auto h-16 w-16 text-muted-foreground/50" />
        <p className="mt-4 text-lg text-muted-foreground">Artista no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/artistas")}>
          Volver a artistas
        </Button>
      </div>
    );
  }

  const imageUrl =
    artista.foto_url ||
    `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80`;

  const pricingNote = "Impuestos no incluidos";

  const isPremiumArtist = bookingPreferences?.tier === "premium";

  const disponibilidadGeograficaLabel =
    artista.disponibilidad_geografica === "ciudades_concretas"
      ? artista.ciudades_disponibles || "Ciudades concretas"
      : artista.disponibilidad_geografica === "internacional"
        ? "Internacional"
        : "Nacional";

  const hayDisponibilidadPublicada = Boolean(
    artista.disponibilidad_fecha ||
      artista.disponibilidad_ciudad ||
      artista.disponibilidad_hora_inicio ||
      artista.disponibilidad_hora_fin ||
      artista.disponibilidad_cache_min ||
      artista.disponibilidad_cache_max ||
      artista.disponibilidad_notas
  );

  const diasSemana = [
    "lunes",
    "martes",
    "miercoles",
    "jueves",
    "viernes",
    "sabado",
    "domingo",
  ];

  return (
    <div className="animate-fade-in space-y-6 pt-2">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="relative h-48 md:h-64">
              <img
                src={imageUrl}
                alt={artista.nombre}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
                      {artista.nombre}
                    </h1>
                    <div className="flex items-center gap-2 mt-2">
                      {artista.estilo && (
                        <Badge className="bg-primary/80 text-primary-foreground">
                          <Music className="h-3 w-3 mr-1" />
                          {artista.estilo}
                        </Badge>
                      )}
                      {artista.categoria && (
                        <Badge variant="outline" className="text-white border-white/50">
                          {getArtistCategoryLabel(artista.categoria)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "bg-white/10 backdrop-blur-sm hover:bg-white/20",
                      isFavorito(artista.id) ? "text-pink-500" : "text-white"
                    )}
                    onClick={() => toggleFavorito(artista.id)}
                  >
                    <Heart
                      className={cn("h-5 w-5", isFavorito(artista.id) && "fill-current")}
                    />
                  </Button>
                </div>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Euro className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Caché</p>
                    <p className="font-semibold">
                      {getArtistPriceRangeDisplay(artista as ArtistaPriceable)}
                    </p>
                  </div>
                </div>

                {artista.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-semibold text-sm truncate">{artista.email}</p>
                    </div>
                  </div>
                )}
              </div>

              {artista.descripcion && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-muted-foreground">{artista.descripcion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-primary" />
                Condiciones y detalles de contratación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Categoría</p>
                  <p className="font-semibold">{artista.categoria ? getArtistCategoryLabel(artista.categoria) : "Sin definir"}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Rango orientativo</p>
                  <p className="font-semibold">
                    {getArtistPriceRangeDisplay(artista as ArtistaPriceable)}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">{pricingNote}</p>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Disponibilidad geográfica</p>
                  <p className="font-semibold">{disponibilidadGeograficaLabel}</p>
                </div>
              </div>

              {artista.booking_notes && (
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium">Notas de booking</p>
                  <p className="text-sm text-muted-foreground">{artista.booking_notes}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium">Hospitality rider</p>
                  <p className="text-sm text-muted-foreground">
                    El PDF y el detalle completo del hospitality rider solo se compartirán cuando la negociación esté activa.
                  </p>
                  {artista.rider_hospitality_comentarios && (
                    <p className="text-xs text-muted-foreground">
                      Comentarios previos: {artista.rider_hospitality_comentarios}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4 space-y-2">
                  <p className="text-sm font-medium">Rider técnico</p>
                  <p className="text-sm text-muted-foreground">
                    El PDF y el detalle completo del rider técnico solo se compartirán cuando la negociación esté activa.
                  </p>
                  {artista.rider_tecnico_comentarios && (
                    <p className="text-xs text-muted-foreground">
                      Comentarios previos: {artista.rider_tecnico_comentarios}
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-border p-4">
                <p className="text-sm font-medium mb-3">Requisitos habituales</p>
                <div className="flex flex-wrap gap-2">
                  {bookingPreferences?.requires_hotel && <Badge variant="secondary">Hotel</Badge>}
                  {bookingPreferences?.requires_transport && <Badge variant="secondary">Transporte</Badge>}
                  {bookingPreferences?.requires_dietas && <Badge variant="secondary">Dietas</Badge>}
                  {bookingPreferences?.requires_transfers && <Badge variant="secondary">Transfers</Badge>}
                  {!bookingPreferences?.requires_hotel &&
                    !bookingPreferences?.requires_transport &&
                    !bookingPreferences?.requires_dietas &&
                    !bookingPreferences?.requires_transfers && (
                      <p className="text-sm text-muted-foreground">Sin requisitos habituales marcados</p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hayDisponibilidadPublicada && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
                  <p className="text-sm font-medium">Nueva disponibilidad publicada</p>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {artista.disponibilidad_fecha && (
                      <p>
                        Fecha: {format(new Date(`${artista.disponibilidad_fecha}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                    )}
                    {artista.disponibilidad_ciudad && <p>Ubicación: {artista.disponibilidad_ciudad}</p>}
                    {artista.disponibilidad_hora_inicio && artista.disponibilidad_hora_fin && (
                      <p>
                        Franja: {artista.disponibilidad_hora_inicio} - {artista.disponibilidad_hora_fin}
                      </p>
                    )}
                    {(artista.disponibilidad_cache_min || artista.disponibilidad_cache_max) && (
                      <p>
                        Caché disponibilidad: {artista.disponibilidad_cache_min && artista.disponibilidad_cache_max
                          ? `${formatNumberWithDots(Number(artista.disponibilidad_cache_min).toString())}€ - ${formatNumberWithDots(Number(artista.disponibilidad_cache_max).toString())}€`
                          : artista.disponibilidad_cache_min
                            ? `Desde ${formatNumberWithDots(Number(artista.disponibilidad_cache_min).toString())}€`
                            : `Hasta ${formatNumberWithDots(Number(artista.disponibilidad_cache_max).toString())}€`}
                      </p>
                    )}
                    {artista.disponibilidad_notas && <p>Notas: {artista.disponibilidad_notas}</p>}
                  </div>
                  <Button
                    className="mt-3"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        fecha: artista.disponibilidad_fecha || "",
                        hora: artista.disponibilidad_hora_inicio || "",
                        ubicacion: artista.disponibilidad_ciudad || "",
                        importe: artista.disponibilidad_cache_min
                          ? String(artista.disponibilidad_cache_min)
                          : prev.importe,
                        notas: "",
                      }));
                      setAvailabilityRequestOpen(true);
                    }}
                  >
                    Solicitar actuación para esta disponibilidad
                  </Button>
                </div>
              )}

              {disponibilidadPremium && disponibilidadPremium.length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(
                    disponibilidadPremium.reduce((acc, disp) => {
                      const pais = disp.pais || "España";
                      if (!acc[pais]) acc[pais] = [];
                      acc[pais].push(disp);
                      return acc;
                    }, {} as Record<string, typeof disponibilidadPremium>)
                  ).map(([pais, fechas]) => (
                    <div key={pais}>
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-muted-foreground">{pais}</span>
                      </div>
                      <div className="space-y-2 ml-6">
                        {fechas.map((disp) => (
                          <div
                            key={disp.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-success/5 border-success/20"
                          >
                            <div>
                              <p className="font-medium">
                                {format(new Date(`${disp.fecha}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {disp.ciudad}
                                {disp.notas && ` · ${disp.notas}`}
                              </p>
                            </div>
                            {disp.cache_especial && (
                              <Badge variant="secondary" className="font-semibold">
                                {formatNumberWithDots(Number(disp.cache_especial).toString())}€
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : disponibilidadSemanal && disponibilidadSemanal.length > 0 ? (
                <div className="grid grid-cols-7 gap-2">
                  {diasSemana.map((dia) => {
                    const disponible = disponibilidadSemanal.find(
                      (d) => d.dia_semana.toLowerCase() === dia
                    );

                    return (
                      <div
                        key={dia}
                        className={cn(
                          "text-center p-3 rounded-lg border transition-colors",
                          disponible?.activo
                            ? "bg-success/10 border-success/30 text-success"
                            : "bg-muted/50 border-border text-muted-foreground"
                        )}
                      >
                        <p className="text-xs font-medium capitalize">{dia.slice(0, 3)}</p>
                        {disponible?.activo && disponible.hora_inicio && (
                          <p className="text-[10px] mt-1">{disponible.hora_inicio.slice(0, 5)}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : hayDisponibilidadPublicada ? null : (
                <p className="text-muted-foreground text-sm">
                  Sin disponibilidad configurada. Consulta directamente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Solicitar presupuesto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Selecciona una fecha
                </Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedDate
                        ? format(selectedDate, "PPP", { locale: es })
                        : "Elegir fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        if (date) setCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>


              <Dialog open={solicitudOpen} onOpenChange={setSolicitudOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Solicitar precio personalizado
                  </Button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar presupuesto a {artista.nombre}</DialogTitle>
                    <DialogDescription>
                      Completa los detalles de tu evento para enviar una oferta inicial
                      al artista o a su representante.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="importe">Oferta económica (€)</Label>
                        <Input
                          id="importe"
                          type="number"
                          min="0"
                          placeholder={isPremiumArtist ? "Ej. 35000" : "Ej. 6000"}
                          value={formData.importe}
                          onChange={(e) =>
                            setFormData({ ...formData, importe: e.target.value })
                          }
                        />
                        {(() => {
                          const hint = getPriceHint(artista, bookingPreferences, formData.showType);
                          const price = Number(formData.importe);
                          const quality = hint ? evaluatePriceQuality(price, hint.minPrice, hint.maxPrice) : null;
                          return (
                            <div className="mt-1 space-y-1">
                              {hint && (
                                <p className="text-xs font-medium text-primary">
                                  {hint.label}: {formatNumberWithDots(hint.minPrice)}€ – {formatNumberWithDots(hint.maxPrice)}€
                                </p>
                              )}
                              {quality && quality.message && (
                                <p
                                  className={`text-xs ${
                                    quality.level === "good"
                                      ? "text-emerald-600"
                                      : quality.level === "warning"
                                      ? "text-amber-600"
                                      : "text-rose-600"
                                  }`}
                                >
                                  {quality.message}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">{pricingNote}</p>
                            </div>
                          );
                        })()}
                      </div>

                      <div>
                        <Label htmlFor="depositPercent">Adelanto propuesto (%)</Label>
                        <Select
                          value={formData.depositPercent}
                          onValueChange={(value) =>
                            setFormData({ ...formData, depositPercent: value as "25" | "50" | "100" })
                          }
                        >
                          <SelectTrigger id="depositPercent">
                            <SelectValue placeholder="Selecciona adelanto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="hora">Hora de inicio</Label>
                        <Input
                          id="hora"
                          type="time"
                          value={formData.hora}
                          onChange={(e) =>
                            setFormData({ ...formData, hora: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="showType">Tipo de show</Label>
                        <Select
                          value={formData.showType}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              showType: value as "showcase" | "concierto",
                              durationMinutes: value === "showcase" ? "15" : "60",
                            })
                          }
                        >
                          <SelectTrigger id="showType">
                            <SelectValue placeholder="Tipo de show" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="showcase">Showcase</SelectItem>
                            <SelectItem value="concierto">Concierto</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="durationMinutes">Duración (minutos)</Label>
                        <Select
                          value={formData.durationMinutes}
                          onValueChange={(value) =>
                            setFormData({ ...formData, durationMinutes: value })
                          }
                        >
                          <SelectTrigger id="durationMinutes">
                            <SelectValue placeholder="Duración" />
                          </SelectTrigger>
                          <SelectContent>
                            {getDurationOptions(formData.showType).map((min) => (
                              <SelectItem key={min} value={String(min)}>
                                {min} min
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ubicacion">Ubicación del evento</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ubicacion"
                          placeholder="Madrid, España"
                          className="pl-10"
                          value={formData.ubicacion}
                          onChange={(e) =>
                            setFormData({ ...formData, ubicacion: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notas">Mensaje de la oferta</Label>
                      <Textarea
                        id="notas"
                        placeholder="Describe tu evento, tipo de público, qué incluye la propuesta y cualquier detalle importante..."
                        value={formData.notas}
                        onChange={(e) =>
                          setFormData({ ...formData, notas: e.target.value })
                        }
                      />
                    </div>

                    <Button className="w-full" onClick={handleSolicitud}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar oferta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={availabilityRequestOpen} onOpenChange={setAvailabilityRequestOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Solicitar actuación para esta disponibilidad</DialogTitle>
                    <DialogDescription>
                      Estás solicitando la disponibilidad concreta publicada por {artista.nombre}. La fecha y la franja horaria quedan fijadas.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-4">
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm text-muted-foreground">
                      {artista.disponibilidad_fecha && (
                        <p>
                          Fecha: {format(new Date(`${artista.disponibilidad_fecha}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
                        </p>
                      )}
                      {artista.disponibilidad_ciudad && <p>Ubicación: {artista.disponibilidad_ciudad}</p>}
                      {artista.disponibilidad_hora_inicio && artista.disponibilidad_hora_fin && (
                        <p>
                          Franja: {artista.disponibilidad_hora_inicio} - {artista.disponibilidad_hora_fin}
                        </p>
                      )}
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1 text-sm text-muted-foreground">
                      <p>Tipo de actuación: Concierto</p>
                      <p>Duración estimada: 120 min</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="availability-importe">Oferta económica (€)</Label>
                        <Input
                          id="availability-importe"
                          type="number"
                          min="0"
                          value={formData.importe}
                          onChange={(e) =>
                            setFormData({ ...formData, importe: e.target.value })
                          }
                        />
                        {(artista.disponibilidad_cache_min || artista.disponibilidad_cache_max) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Rango publicado: {artista.disponibilidad_cache_min && artista.disponibilidad_cache_max
                              ? `${formatNumberWithDots(Number(artista.disponibilidad_cache_min).toString())}€ - ${formatNumberWithDots(Number(artista.disponibilidad_cache_max).toString())}€`
                              : artista.disponibilidad_cache_min
                                ? `Desde ${formatNumberWithDots(Number(artista.disponibilidad_cache_min).toString())}€`
                                : `Hasta ${formatNumberWithDots(Number(artista.disponibilidad_cache_max).toString())}€`}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="availability-deposit">Adelanto propuesto (%)</Label>
                        <Select
                          value={formData.depositPercent}
                          onValueChange={(value) =>
                            setFormData({ ...formData, depositPercent: value as "25" | "50" | "100" })
                          }
                        >
                          <SelectTrigger id="availability-deposit">
                            <SelectValue placeholder="Selecciona adelanto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25%</SelectItem>
                            <SelectItem value="50">50%</SelectItem>
                            <SelectItem value="100">100%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="availability-notas">Comentarios</Label>
                      <Textarea
                        id="availability-notas"
                        placeholder="Añade cualquier comentario adicional sobre esta actuación concreta..."
                        value={formData.notas}
                        onChange={(e) =>
                          setFormData({ ...formData, notas: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        handleSolicitud({
                          fixedDate: artista.disponibilidad_fecha || undefined,
                          fixedHour: artista.disponibilidad_hora_inicio || undefined,
                          fixedLocation: artista.disponibilidad_ciudad || undefined,
                          fixedDurationMinutes: "120",
                          fixedShowType: "concierto",
                          minimumAvailabilityFee: artista.disponibilidad_cache_min || undefined,
                        })
                      }
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar solicitud para esta disponibilidad
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="pt-4 border-t border-border space-y-1 text-center">
                {artista.pricing_visibility === "range" &&
                artista.cache_min &&
                artista.cache_max ? (
                  <>
                    <p className="text-sm text-muted-foreground">Rango orientativo</p>
                    <p className="font-semibold text-foreground">
                      €{formatNumberWithDots(Number(artista.cache_min).toString())} - €
                      {formatNumberWithDots(Number(artista.cache_max).toString())}
                    </p>
                  </>
                ) : artista.pricing_visibility === "hidden" ? (
                  <>
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="font-semibold text-foreground">Bajo solicitud</p>
                  </>
                ) : artista.cache ? (
                  <>
                    <p className="text-sm text-muted-foreground">Caché base</p>
                    <p className="font-semibold text-foreground">
                      {formatNumberWithDots(Number(artista.cache).toString())}€
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="font-semibold text-foreground">A consultar</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}