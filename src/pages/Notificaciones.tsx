import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, AlertCircle, MessageSquareReply, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

type BookingDeal = {
  id: string;
  artist_id: string;
  venue_profile_id: string;
  representative_profile_id: string | null;
  artist_profile_id: string | null;
  venue_name: string;
  city: string | null;
  country: string | null;
  event_date: string;
  event_start_time: string | null;
  duration_minutes: number | null;
  event_type: string | null;
  currency: string;
  total_fee: number | null;
  deposit_percent: number | null;
  current_offer_version: number;
  latest_offer_id: string | null;
  current_status:
    | "inquiry"
    | "offer_sent"
    | "countered"
    | "accepted"
    | "rejected"
    | "expired"
    | "contract_pending"
    | "deposit_pending"
    | "deposit_paid"
    | "completed"
    | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type BookingOffer = {
  id: string;
  booking_deal_id: string;
  version: number;
  created_by_profile_id: string;
  created_by_role: "venue" | "artist" | "representative";
  offer_amount: number;
  currency: string;
  tax_mode: "plus_vat" | "vat_included" | "tax_exempt";
  vat_percent: number | null;
  deposit_percent_requested: number | null;
  deposit_percent_min: number | null;
  includes_hotel: boolean;
  includes_transport: boolean;
  includes_dietas: boolean;
  includes_transfers: boolean;
  includes_hospitality_rider: boolean;
  message: string | null;
  additional_terms: string | null;
  notes: string | null;
  is_counter_offer: boolean;
  status: "active" | "accepted" | "rejected" | "superseded" | "expired";
  created_at: string;
};


type ArtistBookingPreference = {
  artist_id: string;
  tier: "standard" | "premium";
  deposit_percent_default: number;
  deposit_percent_min: number;
  max_offer_versions: number;
};


type ArtistSummary = {
  id: string;
  nombre: string;
  foto_url: string | null;
  cache: number | null;
  rider_tecnico_pdf: string | null;
  rider_tecnico_comentarios: string | null;
  rider_hospitality_pdf: string | null;
  rider_hospitality_comentarios: string | null;
};


type DealRider = {
  id: string;
  booking_deal_id: string;
  defined_by_role: "artist" | "representative";
  defined_by_profile_id: string | null;
  technical_requires_cdjs: boolean;
  technical_requires_mixer: boolean;
  technical_requires_monitors: boolean;
  technical_requires_microphone: boolean;
  technical_requires_sound_engineer: boolean;
  technical_requires_lighting: boolean;
  technical_requires_dj_booth: boolean;
  technical_requires_power_access: boolean;
  technical_additional_notes: string | null;
  hospitality_requires_hotel: boolean;
  hospitality_requires_catering: boolean;
  hospitality_requires_dressing_room: boolean;
  hospitality_requires_beverages: boolean;
  hospitality_requires_ground_transport: boolean;
  hospitality_requires_security_access: boolean;
  hospitality_additional_notes: string | null;
  created_at: string;
  updated_at: string;
};

type ContractRecord = {
  id: string;
  booking_deal_id: string;
  contract_number: string | null;
  status: "draft" | "sent" | "signed_artist" | "signed_venue" | "fully_signed";
  contract_html: string | null;
  contract_pdf_url: string | null;
  sent_at: string | null;
  signed_artist_at: string | null;
  signed_venue_at: string | null;
  created_at: string;
  updated_at: string;
};

type NotificationItem = {
  id: string;
  dealId?: string;
  type: "success" | "warning" | "info";
  title: string;
  message: string;
  time: string;
  status?: BookingDeal["current_status"];
  isAvailability?: boolean;
  artistId?: string;
};

const formatMoney = (amount: number | null | undefined, currency = "EUR") => {
  const value = Number(amount || 0);
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};



const getTechnicalRiderItems = (rider: DealRider | null) => {
  if (!rider) return [] as string[];

  return [
    rider.technical_requires_cdjs ? "CDJs / reproductores" : null,
    rider.technical_requires_mixer ? "Mixer" : null,
    rider.technical_requires_monitors ? "Monitores booth" : null,
    rider.technical_requires_microphone ? "Micrófono" : null,
    rider.technical_requires_sound_engineer ? "Técnico de sonido" : null,
    rider.technical_requires_lighting ? "Iluminación" : null,
    rider.technical_requires_dj_booth ? "Cabina DJ" : null,
    rider.technical_requires_power_access ? "Acceso eléctrico" : null,
  ].filter(Boolean) as string[];
};

const getHospitalityRiderItems = (rider: DealRider | null) => {
  if (!rider) return [] as string[];

  return [
    rider.hospitality_requires_hotel ? "Hotel" : null,
    rider.hospitality_requires_catering ? "Catering" : null,
    rider.hospitality_requires_dressing_room ? "Camerino" : null,
    rider.hospitality_requires_beverages ? "Bebidas" : null,
    rider.hospitality_requires_ground_transport ? "Transporte local" : null,
    rider.hospitality_requires_security_access ? "Acceso / seguridad" : null,
  ].filter(Boolean) as string[];
};

const formatearTiempoRelativo = (fecha: string) => {
  const now = new Date();
  const date = new Date(fecha);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Hace menos de 1 hora";
  if (diffHours < 24) return `Hace ${diffHours} h`;
  if (diffDays === 1) return "Hace 1 día";
  if (diffDays < 7) return `Hace ${diffDays} días`;

  return format(date, "d MMM yyyy", { locale: es });
};

function Notificaciones() {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [counterOfferOpen, setCounterOfferOpen] = useState(false);
  const [counterOfferTarget, setCounterOfferTarget] = useState<BookingDeal | null>(null);
  const [counterOfferForm, setCounterOfferForm] = useState({
    amount: "",
    depositPercent: "",
    message: "",
  });

  // Estado del diálogo de negociación de rider
  const [riderNegDialogOpen, setRiderNegDialogOpen] = useState(false);
  const [riderNegTarget, setRiderNegTarget] = useState<BookingDeal | null>(null);
  const [riderNegNotes, setRiderNegNotes] = useState("");
  const [riderNegSaving, setRiderNegSaving] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["venue-negotiation-notifications"],
    queryFn: async () => {
      const { data: dealsData, error: dealsError } = await supabase
        .from("booking_deals")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(50);

      if (dealsError) throw dealsError;

      const deals = (dealsData || []) as BookingDeal[];
      const latestOfferIds = deals
        .map((deal) => deal.latest_offer_id)
        .filter((value): value is string => Boolean(value));
      const artistIds = Array.from(new Set(deals.map((deal) => deal.artist_id).filter(Boolean)));

      const offersByDeal: Record<string, BookingOffer | null> = {};
      const preferencesByArtist: Record<string, ArtistBookingPreference> = {};
      const artistsById: Record<string, ArtistSummary> = {};
      const ridersByDealId: Record<string, DealRider | null> = {};
      const contractsByDealId: Record<string, ContractRecord | null> = {};

      if (latestOfferIds.length > 0) {
        const { data: offersData, error: offersError } = await supabase
          .from("booking_offers")
          .select("*")
          .in("id", latestOfferIds);

        if (offersError) throw offersError;

        (offersData as BookingOffer[] | null)?.forEach((offer) => {
          offersByDeal[offer.booking_deal_id] = offer;
        });
      }

      if (artistIds.length > 0) {
        const { data: preferencesData, error: preferencesError } = await supabase
          .from("artist_booking_preferences")
          .select("artist_id,tier,deposit_percent_default,deposit_percent_min,max_offer_versions")
          .in("artist_id", artistIds);

        if (preferencesError) throw preferencesError;

        (preferencesData as ArtistBookingPreference[] | null)?.forEach((preference) => {
          preferencesByArtist[preference.artist_id] = preference;
        });
      }

      if (artistIds.length > 0) {
        const { data: artistsData, error: artistsError } = await supabase
          .from("artistas")
          .select("id,nombre,foto_url,cache,rider_tecnico_pdf,rider_tecnico_comentarios,rider_hospitality_pdf,rider_hospitality_comentarios")
          .in("id", artistIds);

        if (artistsError) throw artistsError;

        (artistsData as ArtistSummary[] | null)?.forEach((artist) => {
          artistsById[artist.id] = artist;
        });
      }

      const dealIds = deals.map((deal) => deal.id).filter(Boolean);
      if (dealIds.length > 0) {
        const { data: ridersData, error: ridersError } = await supabase
          .from("deal_riders")
          .select("*")
          .in("booking_deal_id", dealIds);

        if (ridersError) throw ridersError;

        (ridersData as DealRider[] | null)?.forEach((rider) => {
          ridersByDealId[rider.booking_deal_id] = rider;
        });
      }

      if (dealIds.length > 0) {
        const { data: contractsData, error: contractsError } = await supabase
          .from("contracts")
          .select("*")
          .in("booking_deal_id", dealIds);

        if (contractsError) throw contractsError;

        (contractsData as ContractRecord[] | null)?.forEach((contract) => {
          contractsByDealId[contract.booking_deal_id] = contract;
        });
      }

      // NUEVAS DISPONIBILIDADES
      let availabilityData: any[] = [];
      const { data: rawAvailabilityData, error: availabilityError } = await supabase
        .from("artistas")
        .select(
          "id,nombre,disponibilidad_fecha,disponibilidad_ciudad,disponibilidad_hora_inicio,disponibilidad_hora_fin,disponibilidad_tipo_actuacion,updated_at"
        )
        .not("disponibilidad_fecha", "is", null)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (!availabilityError && rawAvailabilityData) {
        availabilityData = rawAvailabilityData;
      } else {
        console.error("No se pudieron cargar las disponibilidades publicadas", availabilityError);
      }

      return { deals, offersByDeal, preferencesByArtist, artistsById, ridersByDealId, contractsByDealId, availabilityData };
    },
  });

  const deals = data?.deals || [];
  const offersByDeal = data?.offersByDeal || {};
  const preferencesByArtist = data?.preferencesByArtist || {};
  const artistsById = data?.artistsById || {};
  const ridersByDealId = data?.ridersByDealId || {};
  const contractsByDealId = data?.contractsByDealId || {};
  const availabilityData = data?.availabilityData || [];

  const getIconByType = (tipo: NotificationItem["type"]) => {
    switch (tipo) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getBadgeVariant = (tipo: NotificationItem["type"]) => {
    switch (tipo) {
      case "success":
        return "default" as const;
      case "warning":
        return "destructive" as const;
      default:
        return "outline" as const;
    }
  };

  const notifications = useMemo<NotificationItem[]>(() => {
    const dealNotifications = deals.map((deal) => {
      const latestOffer = offersByDeal[deal.id] || null;
      const importe = latestOffer?.offer_amount ?? deal.total_fee ?? 0;

      const type: NotificationItem["type"] =
        deal.current_status === "rejected" || deal.current_status === "cancelled"
          ? "warning"
          : deal.current_status === "contract_pending" ||
              deal.current_status === "accepted" ||
              deal.current_status === "deposit_paid" ||
              deal.current_status === "completed"
            ? "success"
            : "info";

      const artistName = artistsById[deal.artist_id]?.nombre || "Artista";

      const title =
        deal.current_status === "contract_pending" || deal.current_status === "accepted"
          ? `Oferta aceptada · ${artistName}`
          : deal.current_status === "countered"
            ? `Contraoferta recibida · ${artistName}`
            : deal.current_status === "rejected"
              ? `Oferta rechazada · ${artistName}`
              : deal.current_status === "deposit_paid"
                ? `Adelanto pagado · ${artistName}`
                : deal.current_status === "completed"
                  ? `Actuación completada · ${artistName}`
                  : `Oferta enviada · ${artistName}`;

      const message =
        deal.current_status === "contract_pending" || deal.current_status === "accepted"
          ? `${artistName} ha aceptado la negociación y ha compartido los detalles del rider.`
          : deal.current_status === "countered"
            ? `${artistName} ha respondido con una nueva propuesta de ${formatMoney(importe, latestOffer?.currency || deal.currency)}.`
            : deal.current_status === "rejected"
              ? `${artistName} ha rechazado la propuesta.`
              : deal.current_status === "deposit_paid"
                ? `El adelanto de ${formatMoney(importe, latestOffer?.currency || deal.currency)} ya figura como pagado.`
                : deal.current_status === "completed"
                  ? `La contratación con ${artistName} figura como completada.`
                  : `Tu oferta por ${formatMoney(importe, latestOffer?.currency || deal.currency)} sigue pendiente.`;

      return {
        id: deal.id,
        dealId: deal.id,
        type,
        title,
        message,
        time: formatearTiempoRelativo(deal.updated_at || deal.created_at),
        status: deal.current_status,
      };
    });

    const availabilityNotifications = availabilityData.map((artist: any) => ({
      id: `availability-${artist.id}`,
      type: "info" as const,
      title: `Nueva disponibilidad · ${artist.nombre}`,
      message: `${artist.nombre} ha publicado una nueva disponibilidad${artist.disponibilidad_fecha ? ` para el ${artist.disponibilidad_fecha}` : ""}${artist.disponibilidad_ciudad ? ` en ${artist.disponibilidad_ciudad}` : ""}${artist.disponibilidad_hora_inicio && artist.disponibilidad_hora_fin ? ` · ${artist.disponibilidad_hora_inicio} - ${artist.disponibilidad_hora_fin}` : ""}${artist.disponibilidad_tipo_actuacion ? ` · ${artist.disponibilidad_tipo_actuacion === "concierto" ? "Concierto" : "Showcase"}` : ""}.`,
      time: formatearTiempoRelativo(artist.updated_at),
      isAvailability: true,
      artistId: artist.id,
    }));

    return [...availabilityNotifications, ...dealNotifications];
  }, [deals, offersByDeal, artistsById, availabilityData]);

  const notificationsSorted = useMemo(() => {
    const safeDeals: BookingDeal[] = deals || [];
    const safeAvailability: any[] = availabilityData || [];

    const parseNotificationTime = (notification: NotificationItem) => {
      if (notification.dealId) {
        const deal = safeDeals.find((item) => item.id === notification.dealId);
        const ts = Date.parse(deal?.updated_at || deal?.created_at || "");
        return isNaN(ts) ? 0 : ts;
      }
      const match = safeAvailability.find((item: any) => `availability-${item.id}` === notification.id);
      const ts = Date.parse(match?.updated_at || "");
      return isNaN(ts) ? 0 : ts;
    };

    return [...(notifications || [])].sort((a, b) => parseNotificationTime(b) - parseNotificationTime(a));
  }, [notifications, deals, availabilityData]);

  const actualizarEstadoDeal = async (
    dealId: string,
    nuevoEstado: BookingDeal["current_status"]
  ) => {
    setUpdatingId(dealId);

    const payload: Record<string, unknown> = {
      current_status: nuevoEstado,
      updated_at: new Date().toISOString(),
    };

    if (nuevoEstado === "accepted") {
      payload.current_status = "contract_pending";
    }

    const deal = deals.find((item) => item.id === dealId);
    const latestOffer = deal ? offersByDeal[deal.id] || null : null;
    const rider = deal ? ridersByDealId[deal.id] || null : null;
    const artist = deal ? artistsById[deal.artist_id] || null : null;

    const { error } = await supabase.from("booking_deals").update(payload).eq("id", dealId);

    if (error) {
      toast.error("No se pudo actualizar la negociación");
      setUpdatingId(null);
      return;
    }

    if (nuevoEstado === "accepted" && deal) {
      const { data: existingContract, error: existingContractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("booking_deal_id", dealId)
        .maybeSingle();

      if (existingContractError) {
        toast.error("La negociación se aceptó, pero no se pudo verificar el contrato");
        setUpdatingId(null);
        return;
      }

      if (!existingContract) {
        const agreedAmount = latestOffer?.offer_amount ?? deal.total_fee ?? 0;
        const agreedDeposit = latestOffer?.deposit_percent_requested ?? deal.deposit_percent ?? 0;
        const taxNote =
          latestOffer?.tax_mode === "plus_vat"
            ? "IVA no incluido"
            : latestOffer?.tax_mode === "vat_included"
              ? "IVA incluido"
              : "Sin impuestos";

        const technicalItems = getTechnicalRiderItems(rider);
        const hospitalityItems = getHospitalityRiderItems(rider);

        const contractHtml = `
          <h1>Contrato de actuación</h1>
          <p><strong>Venue:</strong> ${deal.venue_name}</p>
          <p><strong>Artista:</strong> ${artist?.nombre || "Artista"}</p>
          <p><strong>Fecha:</strong> ${deal.event_date}</p>
          <p><strong>Hora:</strong> ${deal.event_start_time || "-"}</p>
          <p><strong>Duración:</strong> ${deal.duration_minutes || 0} min</p>
          <p><strong>Ubicación:</strong> ${deal.city || "-"}, ${deal.country || "-"}</p>
          <p><strong>Importe acordado:</strong> ${formatMoney(agreedAmount, latestOffer?.currency || deal.currency)} (${taxNote})</p>
          <p><strong>Adelanto acordado:</strong> ${agreedDeposit}%</p>
          <p><strong>Mensaje / condiciones:</strong> ${latestOffer?.message || deal.notes || "-"}</p>
          <h2>Rider técnico</h2>
          <p>${technicalItems.length > 0 ? technicalItems.join(", ") : "Sin requisitos técnicos marcados"}</p>
          <p>${rider?.technical_additional_notes || ""}</p>
          <h2>Hospitality</h2>
          <p>${hospitalityItems.length > 0 ? hospitalityItems.join(", ") : "Sin requisitos de hospitality marcados"}</p>
          <p>${rider?.hospitality_additional_notes || ""}</p>
        `;

        const contractNumber = `CT-${new Date().getFullYear()}-${dealId.slice(0, 8).toUpperCase()}`;

        const { error: contractInsertError } = await supabase.from("contracts").insert({
          booking_deal_id: dealId,
          contract_number: contractNumber,
          status: "draft",
          contract_html: contractHtml,
          updated_at: new Date().toISOString(),
        });

        if (contractInsertError) {
          toast.error("La negociación se aceptó, pero no se pudo crear el borrador de contrato");
          setUpdatingId(null);
          return;
        }
      }
    }

    toast.success(
      nuevoEstado === "accepted"
        ? "Oferta aceptada. El siguiente paso será generar el contrato."
        : "Negociación actualizada correctamente"
    );

    setUpdatingId(null);
    refetch();
  };

  const abrirNegociacionRider = (deal: BookingDeal) => {
    setRiderNegTarget(deal);
    // Pre-cargar con las notas existentes del deal (si las hay)
    setRiderNegNotes(deal.notes || "");
    setRiderNegDialogOpen(true);
  };

  const guardarNotasRider = async () => {
    if (!riderNegTarget) return;
    setRiderNegSaving(true);

    const { error } = await supabase
      .from("booking_deals")
      .update({
        notes: riderNegNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", riderNegTarget.id);

    if (error) {
      toast.error("No se pudieron guardar las notas del rider");
      setRiderNegSaving(false);
      return;
    }

    toast.success("Notas sobre el rider guardadas correctamente");
    setRiderNegSaving(false);
    setRiderNegDialogOpen(false);
    setRiderNegTarget(null);
    refetch();
  };

  const abrirContraoferta = (deal: BookingDeal) => {
    const latestOffer = offersByDeal[deal.id] || null;
    const preferences = preferencesByArtist[deal.artist_id];

    setCounterOfferTarget(deal);
    setCounterOfferForm({
      amount: String(latestOffer?.offer_amount ?? deal.total_fee ?? ""),
      depositPercent: String(
        latestOffer?.deposit_percent_requested ??
          deal.deposit_percent ??
          preferences?.deposit_percent_default ??
          40
      ),
      message: latestOffer?.message || "",
    });
    setCounterOfferOpen(true);
  };

  const enviarContraoferta = async () => {
    if (!counterOfferTarget) return;

    const latestOffer = offersByDeal[counterOfferTarget.id] || null;
    const preferences = preferencesByArtist[counterOfferTarget.artist_id];
    const maxVersions = preferences?.max_offer_versions || 4;

    if (counterOfferTarget.current_offer_version >= maxVersions) {
      toast.error(`Se alcanzó el límite de ${maxVersions} rondas de negociación`);
      return;
    }

    const amount = Number(counterOfferForm.amount);
    const depositPercent = Number(counterOfferForm.depositPercent);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Introduce un importe válido para la contraoferta");
      return;
    }

    if (!Number.isFinite(depositPercent) || depositPercent <= 0) {
      toast.error("Introduce un % de adelanto válido");
      return;
    }

    if (preferences?.deposit_percent_min && depositPercent < preferences.deposit_percent_min) {
      toast.error(`El adelanto mínimo permitido es ${preferences.deposit_percent_min}%`);
      return;
    }

    setUpdatingId(counterOfferTarget.id);

    if (latestOffer?.id) {
      await supabase
        .from("booking_offers")
        .update({ status: "superseded" })
        .eq("id", latestOffer.id);
    }

    const nuevaVersion = (counterOfferTarget.current_offer_version || 1) + 1;

    const { data: nuevaOferta, error: nuevaOfertaError } = await supabase
      .from("booking_offers")
      .insert({
        booking_deal_id: counterOfferTarget.id,
        version: nuevaVersion,
        created_by_profile_id: counterOfferTarget.venue_profile_id,
        created_by_role: "venue",
        offer_amount: amount,
        currency: latestOffer?.currency || counterOfferTarget.currency || "EUR",
        tax_mode: latestOffer?.tax_mode || "plus_vat",
        vat_percent: latestOffer?.vat_percent || 21,
        deposit_percent_requested: depositPercent,
        deposit_percent_min: preferences?.deposit_percent_min || latestOffer?.deposit_percent_min || null,
        message: counterOfferForm.message,
        additional_terms: latestOffer?.additional_terms || null,
        notes: counterOfferForm.message,
        is_counter_offer: true,
        status: "active",
      })
      .select("id")
      .single();

    if (nuevaOfertaError || !nuevaOferta) {
      toast.error("No se pudo enviar la contraoferta");
      setUpdatingId(null);
      return;
    }

    const { error: dealUpdateError } = await supabase
      .from("booking_deals")
      .update({
        current_status: "countered",
        current_offer_version: nuevaVersion,
        latest_offer_id: nuevaOferta.id,
        total_fee: amount,
        deposit_percent: depositPercent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", counterOfferTarget.id);

    if (dealUpdateError) {
      toast.error("Se creó la contraoferta, pero no se pudo actualizar el deal");
      setUpdatingId(null);
      return;
    }

    toast.success("Contraoferta enviada correctamente");
    setCounterOfferOpen(false);
    setCounterOfferTarget(null);
    setUpdatingId(null);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 space-y-3">
            <p className="text-base font-semibold text-foreground">No se pudieron cargar las notificaciones</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : typeof error === "string"
                  ? error
                  : error
                    ? JSON.stringify(error)
                    : "Se produjo un error inesperado al cargar las notificaciones."}
            </p>
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
            <p className="text-muted-foreground">
              Negociaciones activas y respuestas pendientes de artistas
            </p>
          </div>
          {notificationsSorted.length > 0 && (
            <Button variant="outline" size="sm">
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {notificationsSorted.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No tienes negociaciones activas ni nuevas disponibilidades publicadas
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notificationsSorted.map((notification) => {
              const deal = notification.dealId
                ? deals.find((item) => item.id === notification.dealId)
                : null;
              const latestOffer = deal ? offersByDeal[deal.id] || null : null;
              const rider = deal ? ridersByDealId[deal.id] || null : null;
              const contract = deal ? contractsByDealId[deal.id] || null : null;
              const technicalItems = getTechnicalRiderItems(rider);
              const hospitalityItems = getHospitalityRiderItems(rider);
              const taxNote =
                latestOffer?.tax_mode === "plus_vat"
                  ? "IVA no incluido"
                  : latestOffer?.tax_mode === "vat_included"
                    ? "IVA incluido"
                    : "Sin impuestos";

              return (
                <Card
                  key={notification.id}
                  className={`transition-colors ${
                    notification.isAvailability
                      ? "border-amber-300 bg-amber-50/60"
                      : notification.status === "offer_sent" ||
                          notification.status === "countered" ||
                          notification.status === "contract_pending"
                        ? "border-primary/50 bg-primary/5"
                        : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getIconByType(notification.type)}</div>
                        <div>
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getBadgeVariant(notification.type)}>
                          {notification.isAvailability
                            ? "Disponibilidad"
                            : notification.status === "contract_pending"
                              ? "Contrato"
                              : notification.status === "countered"
                                ? "Contraoferta"
                                : "Oferta"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </CardHeader>

                  {!notification.isAvailability && deal && (
                    <CardContent className="space-y-4">
                      <div className="rounded-lg border border-border bg-background/70 p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Artista</p>
                            <p className="font-semibold">{artistsById[deal.artist_id]?.nombre || "Sin artista"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Importe</p>
                            <p className="font-semibold">
                              {formatMoney(latestOffer?.offer_amount ?? deal.total_fee, latestOffer?.currency || deal.currency)}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1">{taxNote}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Adelanto</p>
                            <p className="font-semibold">{latestOffer?.deposit_percent_requested || deal.deposit_percent || 0}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Versión</p>
                            <p className="font-semibold">V{latestOffer?.version || deal.current_offer_version || 1}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Fecha</p>
                            <p className="text-sm font-medium">
                              {deal.event_date
                                ? format(new Date(deal.event_date), "PPP", { locale: es })
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Hora</p>
                            <p className="text-sm font-medium">{deal.event_start_time?.slice(0, 5) || "-"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Duración</p>
                            <p className="text-sm font-medium">
                              {deal.duration_minutes ? `${deal.duration_minutes} min` : "-"}
                            </p>
                          </div>
                        </div>


                        {(latestOffer?.message || deal.notes) && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {deal.current_status === "countered" ? "Mensaje del artista" : "Mensaje de la negociación"}
                            </p>
                            <p className="text-sm text-foreground">{latestOffer?.message || deal.notes}</p>
                          </div>
                        )}

                        {rider && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Rider técnico</p>
                              <div className="flex flex-wrap gap-2">
                                {technicalItems.length > 0 ? (
                                  technicalItems.map((item) => (
                                    <Badge key={item} variant="secondary">{item}</Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline">Sin requisitos técnicos marcados</Badge>
                                )}
                              </div>
                              {rider.technical_additional_notes && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {rider.technical_additional_notes}
                                </p>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-muted-foreground mb-2">Hospitality</p>
                              <div className="flex flex-wrap gap-2">
                                {hospitalityItems.length > 0 ? (
                                  hospitalityItems.map((item) => (
                                    <Badge key={item} variant="secondary">{item}</Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline">Sin requisitos de hospitality marcados</Badge>
                                )}
                              </div>
                              {rider.hospitality_additional_notes && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {rider.hospitality_additional_notes}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {deal.current_status === "contract_pending" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              window.location.href = "/contrataciones";
                            }}
                          >
                            Ver contrato
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              onClick={() => actualizarEstadoDeal(deal.id, "accepted")}
                              disabled={updatingId === deal.id}
                            >
                              Aceptar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => actualizarEstadoDeal(deal.id, "rejected")}
                              disabled={updatingId === deal.id}
                            >
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => abrirContraoferta(deal)}
                              disabled={updatingId === deal.id}
                            >
                              <MessageSquareReply className="h-4 w-4 mr-2" />
                              Contraoferta
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => abrirNegociacionRider(deal)}
                              disabled={updatingId === deal.id}
                            >
                              <Wrench className="h-4 w-4 mr-2" />
                              Negociar rider
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  )}

                  {notification.isAvailability && notification.artistId && (
                    <CardContent className="pt-0">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            window.location.href = `/artistas/${notification.artistId}`;
                          }}
                        >
                          Ver artista
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Diálogo negociación rider */}
      <Dialog
        open={riderNegDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setRiderNegDialogOpen(false);
            setRiderNegTarget(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Negociar rider
              {riderNegTarget && artistsById[riderNegTarget.artist_id]
                ? ` · ${artistsById[riderNegTarget.artist_id].nombre}`
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            {/* Mostrar rider actual si existe */}
            {riderNegTarget ? (() => {
              const artist = artistsById[riderNegTarget.artist_id] || null;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Rider técnico</p>
                    {artist?.rider_tecnico_pdf ? (
                      <a
                        href={artist.rider_tecnico_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-medium text-primary underline"
                      >
                        Abrir archivo del rider técnico
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay archivo técnico subido.</p>
                    )}
                    <div>
                      <Label>Comentarios del rider técnico</Label>
                      <Textarea
                        value={artist?.rider_tecnico_comentarios || ""}
                        readOnly
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Rider hospitality</p>
                    {artist?.rider_hospitality_pdf ? (
                      <a
                        href={artist.rider_hospitality_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex text-sm font-medium text-primary underline"
                      >
                        Abrir archivo del rider hospitality
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay archivo hospitality subido.</p>
                    )}
                    <div>
                      <Label>Comentarios del rider hospitality</Label>
                      <Textarea
                        value={artist?.rider_hospitality_comentarios || ""}
                        readOnly
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              );
            })() : null}

            {/* Notas del venue sobre el rider */}
            <div>
              <Label htmlFor="rider-notes">
                Tus notas / condiciones sobre el rider
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Indica aquí tus comentarios o condiciones sobre el rider. Esta negociación se resolverá en esta pantalla, no en la contraoferta económica.
              </p>
              <Textarea
                id="rider-notes"
                value={riderNegNotes}
                onChange={(e) => setRiderNegNotes(e.target.value)}
                placeholder="Ej: Disponemos de CDJs y mixer. No tenemos monitor de booth. El camerino tiene nevera y bebidas incluidas..."
                rows={5}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRiderNegDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={guardarNotasRider} disabled={riderNegSaving}>
                {riderNegSaving ? "Guardando..." : "Guardar notas"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={counterOfferOpen} onOpenChange={setCounterOfferOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar contraoferta</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="counter-amount">Importe de contraoferta (€)</Label>
                <Input
                  id="counter-amount"
                  type="text"
                  inputMode="numeric"
                  value={counterOfferForm.amount}
                  onChange={(e) =>
                    setCounterOfferForm((prev) => ({ ...prev, amount: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="counter-deposit">Adelanto propuesto (%)</Label>
                <Input
                  id="counter-deposit"
                  type="number"
                  value={counterOfferForm.depositPercent}
                  onChange={(e) =>
                    setCounterOfferForm((prev) => ({ ...prev, depositPercent: e.target.value }))
                  }
                />
              </div>
            </div>


            <div>
              <Label htmlFor="counter-message">Mensaje de la contraoferta</Label>
              <Textarea
                id="counter-message"
                value={counterOfferForm.message}
                onChange={(e) =>
                  setCounterOfferForm((prev) => ({ ...prev, message: e.target.value }))
                }
                placeholder="Explica los ajustes de tu contraoferta..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCounterOfferOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={enviarContraoferta} disabled={updatingId === counterOfferTarget?.id}>
                Enviar contraoferta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Notificaciones;