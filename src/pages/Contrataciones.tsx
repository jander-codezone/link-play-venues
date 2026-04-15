import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Search,
  Download,
  Filter,
  Music,
  Check,
  Clock,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  message: string | null;
  additional_terms: string | null;
  notes: string | null;
  is_counter_offer: boolean;
  status: "active" | "accepted" | "rejected" | "superseded" | "expired";
  created_at: string;
};

type ArtistSummary = {
  id: string;
  nombre: string;
  foto_url: string | null;
  cache: number | null;
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

type DealPayment = {
  id: string;
  booking_deal_id: string;
  contract_id: string | null;
  payment_type: "deposit" | "balance";
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  amount: number;
  agreed_amount: number | null;
  platform_fee_percent: number | null;
  platform_fee_total: number | null;
  venue_fee_amount: number | null;
  artist_fee_amount: number | null;
  gross_charge_to_venue: number | null;
  net_to_artist: number | null;
  currency: string;
  provider: string | null;
  provider_status: string | null;
  provider_payment_intent_id: string | null;
  provider_checkout_session_id: string | null;
  provider_charge_id: string | null;
  connected_account_id: string | null;
  payment_link_url: string | null;
  payer_profile_id: string | null;
  payee_profile_id: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
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

const getEstadoContratoBadge = (contract: ContractRecord | null) => {
  if (!contract) {
    return (
      <Badge variant="outline" className="gap-1">
        <FileText className="h-3 w-3" />
        Sin contrato
      </Badge>
    );
  }

  switch (contract.status) {
    case "draft":
      return (
        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 gap-1">
          <FileText className="h-3 w-3" />
          Borrador
        </Badge>
      );
    case "sent":
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
          <Clock className="h-3 w-3" />
          Enviado
        </Badge>
      );
    case "signed_artist":
    case "signed_venue":
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
          <Clock className="h-3 w-3" />
          Firma parcial
        </Badge>
      );
    case "fully_signed":
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
          <Check className="h-3 w-3" />
          Firmado
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          Contrato
        </Badge>
      );
  }
};

export default function Contrataciones() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("todas");
  const [selectedContract, setSelectedContract] = useState<ContractRecord | null>(null);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [contractActionLoading, setContractActionLoading] = useState(false);
  const [checkoutLoadingId, setCheckoutLoadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeStatus = params.get("stripe");

    if (!stripeStatus) return;

    const refreshAfterStripe = async () => {
      await queryClient.invalidateQueries({ queryKey: ["venue-contracting-management"] });
      window.history.replaceState({}, document.title, "/contrataciones");
      window.location.reload();
    };

    refreshAfterStripe();
  }, [queryClient]);
  const abrirContrato = (dealId: string, contract: ContractRecord | null) => {
    if (!contract) return;
    setSelectedDealId(dealId);
    setSelectedContract(contract);
  };

  const firmarContratoVenue = async () => {
    if (!selectedContract || !selectedDealId) return;

    setContractActionLoading(true);

    const nextStatus =
      selectedContract.status === "signed_artist" ? "fully_signed" : "signed_venue";

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from("contracts")
      .update({
        status: nextStatus,
        signed_venue_at: nowIso,
        sent_at: selectedContract.sent_at || nowIso,
        updated_at: nowIso,
      })
      .eq("id", selectedContract.id)
      .select("*")
      .single();

    if (error || !data) {
      setContractActionLoading(false);
      return;
    }

    const updatedContract = data as ContractRecord;

    await queryClient.invalidateQueries({ queryKey: ["venue-contracting-management"] });

    setSelectedContract(updatedContract);

    if (nextStatus === "fully_signed") {
      await supabase
        .from("booking_deals")
        .update({
          current_status: "deposit_pending",
          updated_at: nowIso,
        })
        .eq("id", selectedDealId);

      // Crear registro de pago del adelanto si no existe ya
      const { data: existingPayment } = await supabase
        .from("deal_payments")
        .select("id")
        .eq("booking_deal_id", selectedDealId)
        .eq("payment_type", "deposit")
        .maybeSingle();

      if (!existingPayment) {
        const deal = deals.find((d) => d.id === selectedDealId);
        const offer = offersByDeal[selectedDealId] || null;
        const feeAmount = offer?.offer_amount ?? deal?.total_fee ?? 0;
        const depositPct = offer?.deposit_percent_requested ?? deal?.deposit_percent ?? 0;
        const depositAmount = Math.round((feeAmount * depositPct) / 100);

        if (depositAmount > 0) {
          await supabase.from("deal_payments").insert({
            booking_deal_id: selectedDealId,
            contract_id: selectedContract.id,
            payment_type: "deposit",
            status: "pending",
            amount: depositAmount,
            agreed_amount: depositAmount,
            currency: offer?.currency || deal?.currency || "EUR",
            updated_at: nowIso,
          });
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["venue-contracting-management"] });
    }

    setContractActionLoading(false);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["venue-contracting-management"],
    queryFn: async () => {
      const { data: dealsData, error: dealsError } = await supabase
        .from("booking_deals")
        .select("*")
        .in("current_status", ["contract_pending", "deposit_pending", "deposit_paid", "completed"])
        .order("updated_at", { ascending: false });

      if (dealsError) throw dealsError;

      const deals = (dealsData || []) as BookingDeal[];
      const latestOfferIds = deals
        .map((deal) => deal.latest_offer_id)
        .filter((value): value is string => Boolean(value));
      const artistIds = Array.from(new Set(deals.map((deal) => deal.artist_id).filter(Boolean)));

      const offersByDeal: Record<string, BookingOffer | null> = {};
      const artistsById: Record<string, ArtistSummary> = {};
      const contractsByDeal: Record<string, ContractRecord | null> = {};
      const depositPaymentsByDeal: Record<string, DealPayment | null> = {};

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
        const { data: artistsData, error: artistsError } = await supabase
          .from("artistas")
          .select("id,nombre,foto_url,cache")
          .in("id", artistIds);

        if (artistsError) throw artistsError;

        (artistsData as ArtistSummary[] | null)?.forEach((artist) => {
          artistsById[artist.id] = artist;
        });
      }

      const dealIds = deals.map((deal) => deal.id).filter(Boolean);

      if (dealIds.length > 0) {
        const { data: contractsData, error: contractsError } = await supabase
          .from("contracts")
          .select("*")
          .in("booking_deal_id", dealIds);

        if (contractsError) throw contractsError;

        (contractsData as ContractRecord[] | null)?.forEach((contract) => {
          contractsByDeal[contract.booking_deal_id] = contract;
        });
      }

      if (dealIds.length > 0) {
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("deal_payments")
          .select("*")
          .in("booking_deal_id", dealIds)
          .eq("payment_type", "deposit");

        if (paymentsError) throw paymentsError;

        (paymentsData as DealPayment[] | null)?.forEach((payment) => {
          depositPaymentsByDeal[payment.booking_deal_id] = payment;
        });
      }

      return { deals, offersByDeal, artistsById, contractsByDeal, depositPaymentsByDeal };
    },
  });

  const deals = data?.deals || [];
  const offersByDeal = data?.offersByDeal || {};
  const artistsById = data?.artistsById || {};
  const contractsByDeal = data?.contractsByDeal || {};
  const depositPaymentsByDeal = data?.depositPaymentsByDeal || {};

  const effectiveContractsByDeal =
    selectedContract && selectedDealId
      ? { ...contractsByDeal, [selectedDealId]: selectedContract }
      : contractsByDeal;

  const pagarAdelanto = async (paymentId: string) => {
    setCheckoutLoadingId(paymentId);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-deposit-checkout",
        { body: { paymentId } }
      );

      if (error) {
        console.error("Error creando checkout del adelanto:", error);
        window.alert(`No se pudo abrir el checkout del adelanto. ${error.message || "Error desconocido"}`);
        setCheckoutLoadingId(null);
        return;
      }

      if (!data?.url) {
        console.error("create-deposit-checkout no devolvió URL:", data);
        window.alert("No se pudo generar la URL de pago del adelanto.");
        setCheckoutLoadingId(null);
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Error llamando a create-deposit-checkout:", err);
      window.alert("No se pudo conectar con el servicio de pago.");
      setCheckoutLoadingId(null);
    }
  };

  const getEstadoTab = (deal: BookingDeal) => {
    if (deal.current_status === "completed") return "completada";
    if (deal.current_status === "deposit_pending" || deal.current_status === "deposit_paid") {
      return "confirmada";
    }
    if (deal.current_status === "contract_pending") return "pendiente";
    return "pendiente";
  };

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const artistName = artistsById[deal.artist_id]?.nombre?.toLowerCase() || "";
      const venueName = deal.venue_name?.toLowerCase() || "";
      const query = search.toLowerCase();
      const matchesSearch = artistName.includes(query) || venueName.includes(query);
      const matchesTab = activeTab === "todas" ? true : getEstadoTab(deal) === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [deals, search, artistsById, activeTab]);

  const counts = {
    todas: deals.length,
    pendiente: deals.filter((deal) => getEstadoTab(deal) === "pendiente").length,
    confirmada: deals.filter((deal) => getEstadoTab(deal) === "confirmada").length,
    completada: deals.filter((deal) => getEstadoTab(deal) === "completada").length,
  };

  const getEstadoBadge = (deal: BookingDeal) => {
    switch (deal.current_status) {
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Check className="h-3 w-3" />
            Completada
          </Badge>
        );
      case "deposit_paid":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
            <Check className="h-3 w-3" />
            Adelanto pagado
          </Badge>
        );
      case "deposit_pending":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
            <Clock className="h-3 w-3" />
            Adelanto pendiente
          </Badge>
        );
      case "contract_pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 gap-1">
            <AlertCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Estado desconocido
          </Badge>
        );
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Contrataciones</h1>
            <p className="text-muted-foreground">
              Sigue contratos, acuerdos cerrados y estado posterior a la negociación
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-xl">
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por artista o venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 bg-secondary/50 border-border/50 rounded-xl h-12"
          />
        </div>
        <Button variant="outline" className="rounded-xl h-12">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todas" className="gap-2">
                Todas
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.todas}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pendiente" className="gap-2">
                Pendientes
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.pendiente}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="confirmada" className="gap-2">
                Confirmadas
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.confirmada}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="completada" className="gap-2">
                Completadas
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {counts.completada}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center text-muted-foreground py-16">
              <div className="animate-pulse">Cargando...</div>
            </div>
          ) : !filteredDeals.length ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
              <p className="mt-4 text-lg text-muted-foreground">
                No hay contrataciones en fase post-negociación
              </p>
              <p className="text-sm text-muted-foreground/70">
                Los acuerdos aceptados aparecerán aquí cuando pasen a contrato o pago
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium min-w-[220px]">
                      Venue
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[220px]">
                      Artista
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[110px]">
                      Fecha
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[90px]">
                      Hora
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[100px]">
                      Duración
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[150px]">
                      Importe
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[95px]">
                      Adelanto
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[130px]">
                      Estado
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[130px]">
                      Contrato
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[220px]">
                      Notas
                    </TableHead>
                    <TableHead className="text-muted-foreground font-medium min-w-[130px]">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeals.map((deal, index) => {
                    const latestOffer = offersByDeal[deal.id] || null;
                    const contract = effectiveContractsByDeal[deal.id] || null;
                    const depositPayment = depositPaymentsByDeal[deal.id] || null;
                    const artist = artistsById[deal.artist_id];
                    const taxNote =
                      latestOffer?.tax_mode === "plus_vat"
                        ? "IVA no incluido"
                        : latestOffer?.tax_mode === "vat_included"
                          ? "IVA incluido"
                          : "Sin impuestos";

                    return (
                      <TableRow
                        key={deal.id}
                        className="border-border/50 hover:bg-secondary/30 transition-colors"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {deal.venue_name
                                .split(" ")
                                .map((word) => word[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-medium block">{deal.venue_name}</span>
                              <span className="text-xs text-muted-foreground">
                                {[deal.city, deal.country].filter(Boolean).join(", ") || "-"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden flex-shrink-0">
                              {artist?.foto_url ? (
                                <img
                                  src={artist.foto_url}
                                  alt={artist.nombre}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Music className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div>
                              <span className="font-medium block">
                                {artist?.nombre || "Sin artista"}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {deal.event_type || "-"}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {deal.event_date
                            ? format(new Date(deal.event_date), "d MMM yyyy", { locale: es })
                            : "-"}
                        </TableCell>

                        <TableCell>{deal.event_start_time?.slice(0, 5) || "-"}</TableCell>

                        <TableCell>
                          {deal.duration_minutes ? `${deal.duration_minutes} min` : "-"}
                        </TableCell>

                        <TableCell>
                          <div>
                            <p className="font-semibold">
                              {formatMoney(
                                latestOffer?.offer_amount ?? deal.total_fee,
                                latestOffer?.currency || deal.currency
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground">{taxNote}</p>
                          </div>
                        </TableCell>

                        <TableCell>
                          {latestOffer?.deposit_percent_requested ?? deal.deposit_percent ?? 0}%
                        </TableCell>

                        <TableCell>{getEstadoBadge(deal)}</TableCell>

                        <TableCell>{getEstadoContratoBadge(contract)}</TableCell>

                        <TableCell className="max-w-[260px] align-middle">
                          <span className="truncate block text-sm text-muted-foreground">
                            {latestOffer?.message || deal.notes || "-"}
                          </span>
                        </TableCell>

                        <TableCell className="align-middle text-left">
                          <div className="flex items-center gap-2 flex-wrap justify-start">
                            {deal.current_status === "deposit_pending" && depositPayment?.status === "pending" ? (
                              <Button
                                size="sm"
                                onClick={() => pagarAdelanto(depositPayment.id)}
                                disabled={checkoutLoadingId === depositPayment.id}
                              >
                                {checkoutLoadingId === depositPayment.id ? "Abriendo pago..." : "Pagar adelanto"}
                              </Button>
                            ) : null}

                            {contract ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="justify-start"
                                onClick={() => abrirContrato(deal.id, contract)}
                              >
                                Ver contrato
                              </Button>
                            ) : null}

                            {!contract && !(deal.current_status === "deposit_pending" && depositPayment?.status === "pending") ? (
                              <span className="text-xs text-muted-foreground">No disponible</span>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <Dialog
        open={!!selectedContract}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedContract(null);
            setSelectedDealId(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedContract?.contract_number || "Contrato"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto rounded-lg border border-border/50 bg-secondary/20 p-6">
            {selectedContract?.contract_html ? (
              <div
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No hay contenido de contrato disponible.</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div>{getEstadoContratoBadge(selectedContract)}</div>

            <div className="flex items-center gap-2">
              {(selectedContract?.status === "draft" ||
                selectedContract?.status === "sent" ||
                selectedContract?.status === "signed_artist") && (
                <Button onClick={firmarContratoVenue} disabled={contractActionLoading}>
                  {contractActionLoading ? "Firmando..." : "Firmar contrato"}
                </Button>
              )}

              {selectedContract?.contract_pdf_url && (
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedContract.contract_pdf_url as string, "_blank")}
                >
                  Abrir PDF
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}