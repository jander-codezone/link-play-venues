import { useState } from "react";
import { format, endOfWeek, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, CalendarIcon, Euro, Clock, CheckCircle2 } from "lucide-react";
import { useAIRecommendations, CalendarRecommendation } from "@/hooks/useAIRecommendations";
import { useNegocios } from "@/hooks/useNegocios";
import { cn } from "@/lib/utils";
import { formatNumberWithDots, parseFormattedNumber } from "@/lib/formatNumber";

interface AICalendarProposalDialogProps {
  trigger?: React.ReactNode;
  onApplyProposal?: (programacion: CalendarRecommendation[]) => void;
  defaultStartDate?: Date;
}

export function AICalendarProposalDialog({ trigger, onApplyProposal, defaultStartDate }: AICalendarProposalDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedNegocio, setSelectedNegocio] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate || startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [presupuesto, setPresupuesto] = useState<string>("50000");
  const [presupuestoDisplay, setPresupuestoDisplay] = useState<string>("50.000");
  const [proposal, setProposal] = useState<CalendarRecommendation[] | null>(null);
  const [resumen, setResumen] = useState<string>("");
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(0);

  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = parseFormattedNumber(e.target.value);
    if (rawValue === "" || /^\d+$/.test(rawValue)) {
      setPresupuesto(rawValue);
      setPresupuestoDisplay(rawValue ? formatNumberWithDots(rawValue) : "");
    }
  };

  const { data: negocios } = useNegocios();
  const { isLoading, getCalendarRecommendations } = useAIRecommendations();

  const handleGetProposal = async () => {
    if (!selectedNegocio || !startDate) return;
    const fechaInicio = format(startDate, "yyyy-MM-dd");
    const fechaFin = format(endOfWeek(startDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const result = await getCalendarRecommendations(selectedNegocio, fechaInicio, fechaFin, parseInt(presupuesto));
    if (result) {
      setProposal(result.programacion);
      setResumen(result.resumen);
      setPresupuestoTotal(result.presupuesto_total);
    }
  };

  const handleApplyProposal = () => {
    if (proposal) { onApplyProposal?.(proposal); setOpen(false); }
  };

  const formatHour = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;
  const getDayName = (dateStr: string) => format(new Date(dateStr), "EEEE d", { locale: es });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (<Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90"><Sparkles className="h-4 w-4" />Propuesta IA</Button>)}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Propuesta de Programación IA</DialogTitle>
          <DialogDescription>Genera una programación semanal optimizada basada en tu historial, preferencias y presupuesto</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tu negocio</label>
              <Select value={selectedNegocio} onValueChange={setSelectedNegocio}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>{negocios?.map((negocio) => (<SelectItem key={negocio.id} value={negocio.id}>{negocio.nombre}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Semana</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "d MMM", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={es} className="pointer-events-auto" /></PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Presupuesto semanal (€)</label>
              <Input type="text" value={presupuestoDisplay} onChange={handlePresupuestoChange} placeholder="50.000" />
            </div>
          </div>
          <Button onClick={handleGetProposal} disabled={!selectedNegocio || !startDate || isLoading} className="w-full gap-2">
            {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Generando propuesta...</>) : (<><Sparkles className="h-4 w-4" />Generar Propuesta</>)}
          </Button>
          {resumen && (
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm">{resumen}</p>
              <div className="mt-2 flex items-center gap-2"><Euro className="h-4 w-4 text-primary" /><span className="font-medium">Presupuesto total: {formatNumberWithDots(presupuestoTotal.toString())}€</span></div>
            </div>
          )}
          {proposal && proposal.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Programación propuesta</h4>
              <div className="space-y-2">
                {proposal.map((item, index) => (
                  <div key={`${item.fecha}-${index}`} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="capitalize">{getDayName(item.fecha)}</Badge><span className="font-medium">{item.nombre}</span></div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatHour(item.hora_sugerida)} ({item.duracion_sugerida}min)</span>
                          <span className="flex items-center gap-1"><Euro className="h-3 w-3" />{formatNumberWithDots(item.cache_estimado.toString())}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.razon}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleApplyProposal} className="w-full gap-2" variant="default"><CheckCircle2 className="h-4 w-4" />Aplicar Propuesta al Calendario</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
