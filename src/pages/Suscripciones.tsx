import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Check, Sparkles, Loader2, ExternalLink, Gift, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PLANS = {
  standard: {
    priceId: "price_1SeYjLGOghH19qqnRuI45TPQ",
    productId: "prod_TbmHPNNWG7saPQ",
    name: "Estándar",
    price: 150,
    description: "Para venues que buscan lo esencial",
    features: [
      { text: "Acceso completo a la plataforma", included: true },
      { text: "Gestión de artistas y eventos", included: true },
      { text: "Calendario integrado", included: true },
      { text: "Contrataciones ilimitadas", included: true },
      { text: "Soporte por email", included: true },
      { text: "Acceso a artistas premium", included: false },
      { text: "Recomendaciones con IA", included: false },
      { text: "Soporte prioritario 24/7", included: false },
    ],
  },
  premium: {
    priceId: "price_1SeYjXGOghH19qqnXrtEj11p",
    productId: "prod_TbmIXsJ87Ay3UC",
    name: "Premium",
    price: 215,
    description: "Para venues que quieren lo mejor",
    features: [
      { text: "Acceso completo a la plataforma", included: true },
      { text: "Gestión de artistas y eventos avanzada", included: true },
      { text: "Calendario integrado", included: true },
      { text: "Contrataciones ilimitadas", included: true },
      { text: "Acceso a artistas premium", included: true },
      { text: "Recomendaciones personalizadas con IA", included: true },
      { text: "Análisis avanzado de eventos", included: true },
      { text: "Soporte prioritario 24/7", included: true },
    ],
    popular: true,
  },
};

export default function Suscripciones() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [subscription, setSubscription] = useState<{
    subscribed: boolean;
    product_id: string | null;
    subscription_end: string | null;
  } | null>(null);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "¡Suscripción activada!",
        description: "Ahora tienes acceso a todas las funciones.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Suscripción cancelada",
        description: "No se realizó ningún cargo.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user) {
        setIsCheckingSubscription(false);
        return;
      }

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
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSubscribe = async (priceId: string, planKey: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para suscribirte.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(planKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });

      if (error) throw error;
      if (data?.url) {
        const newWindow = window.open(data.url, "_blank");
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup was blocked, show toast with manual link
          toast({
            title: "Abre el checkout manualmente",
            description: "Tu navegador bloqueó la ventana emergente. Haz clic aquí para continuar.",
            action: (
              <Button variant="outline" size="sm" asChild>
                <a href={data.url} target="_blank" rel="noopener noreferrer">
                  Abrir checkout
                </a>
              </Button>
            ),
          });
        }
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar el proceso de pago.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading("manage");
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
      setIsLoading(null);
    }
  };

  const getCurrentPlan = () => {
    if (!subscription?.subscribed || !subscription.product_id) return null;
    if (subscription.product_id === PLANS.standard.productId) return "standard";
    if (subscription.product_id === PLANS.premium.productId) return "premium";
    return null;
  };

  const currentPlan = getCurrentPlan();

  const handleRefreshSubscription = async () => {
    if (!user) return;
    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
      toast({
        title: "Estado actualizado",
        description: "Tu estado de suscripción ha sido actualizado.",
      });
    } catch (error) {
      console.error("Error checking subscription:", error);
    } finally {
      setIsCheckingSubscription(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header con botón actualizar */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Suscripciones</h1>
          <p className="text-muted-foreground mt-1">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefreshSubscription}
          disabled={isCheckingSubscription}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isCheckingSubscription ? "animate-spin" : ""}`} />
          Actualizar estado
        </Button>
      </div>

      {/* Trial Banner */}
      {!currentPlan && (
        <div className="bg-[hsl(152_69%_95%)] border border-[hsl(152_69%_85%)] rounded-xl p-4 flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-[hsl(152_69%_90%)] flex items-center justify-center shrink-0">
            <Gift className="h-5 w-5 text-[hsl(152_69%_35%)]" />
          </div>
          <div>
            <p className="font-semibold text-[hsl(152_69%_25%)]">30 días de prueba gratis</p>
            <p className="text-sm text-[hsl(152_69%_35%)]">
              Acceso completo a todas las funcionalidades durante tu periodo de prueba
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
        {/* Plan Estándar */}
        <Card className={`relative flex flex-col bg-card border ${currentPlan === "standard" ? "border-primary border-2" : "border-border"}`}>
          {currentPlan === "standard" && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Tu plan</Badge>
            </div>
          )}
          <CardContent className="pt-8 pb-6 flex-1">
            {/* Título centrado */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1">{PLANS.standard.name}</h3>
              <p className="text-sm text-muted-foreground">{PLANS.standard.description}</p>
            </div>
            
            {/* Precio centrado */}
            <div className="text-center mb-2">
              <span className="text-3xl font-bold text-foreground">{PLANS.standard.price}€</span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            
            {/* Texto primer mes gratis */}
            <p className="text-center text-sm text-[hsl(152_69%_40%)] font-medium mb-6">
              Primer mes gratis
            </p>
            
            {/* Features */}
            <ul className="space-y-3">
              {PLANS.standard.features.map((feature) => (
                <li key={feature.text} className={`flex items-center gap-3 text-sm ${!feature.included ? "text-muted-foreground" : "text-foreground"}`}>
                  {feature.included ? (
                    <Check className="h-4 w-4 text-[hsl(152_69%_40%)] shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  )}
                  {feature.text}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-0 pb-6 flex flex-col gap-3">
            {isCheckingSubscription ? (
              <Button disabled className="w-full rounded-lg bg-primary hover:bg-primary/90">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verificando...
              </Button>
            ) : currentPlan === "standard" ? (
              <>
                <p className="text-xs text-muted-foreground text-center">
                  Próxima renovación: {subscription?.subscription_end && new Date(subscription.subscription_end).toLocaleDateString("es-ES")}
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={handleManageSubscription}
                  disabled={isLoading === "manage"}
                >
                  {isLoading === "manage" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gestionar suscripción
                </Button>
              </>
            ) : (
              <Button
                variant={currentPlan === "premium" ? "outline" : "default"}
                className="w-full rounded-lg bg-primary hover:bg-primary/90"
                onClick={() => handleSubscribe(PLANS.standard.priceId, "standard")}
                disabled={isLoading === "standard"}
              >
                {isLoading === "standard" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentPlan === "premium" ? "Cambiar a Estándar" : "Comenzar prueba gratuita"}
              </Button>
            )}
          </CardFooter>
        </Card>

        {/* Plan Premium */}
        <Card className={`relative flex flex-col bg-card border ${currentPlan === "premium" ? "border-primary border-2" : "border-border"}`}>
          {currentPlan === "premium" ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">Tu plan</Badge>
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-amber-400 text-amber-900 hover:bg-amber-400">Recomendado</Badge>
            </div>
          )}
          <CardContent className="pt-8 pb-6 flex-1">
            {/* Título centrado con icono */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-foreground mb-1 flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {PLANS.premium.name}
              </h3>
              <p className="text-sm text-muted-foreground">{PLANS.premium.description}</p>
            </div>
            
            {/* Precio centrado */}
            <div className="text-center mb-2">
              <span className="text-3xl font-bold text-foreground">{PLANS.premium.price}€</span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>
            
            {/* Texto primer mes gratis */}
            <p className="text-center text-sm text-[hsl(152_69%_40%)] font-medium mb-6">
              Primer mes gratis
            </p>
            
            {/* Features */}
            <ul className="space-y-3">
              {PLANS.premium.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4 text-[hsl(152_69%_40%)] shrink-0" />
                  {feature.text}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="pt-0 pb-6 flex flex-col gap-3">
            {isCheckingSubscription ? (
              <Button disabled className="w-full rounded-lg bg-primary hover:bg-primary/90">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verificando...
              </Button>
            ) : currentPlan === "premium" ? (
              <>
                <p className="text-xs text-muted-foreground text-center">
                  Próxima renovación: {subscription?.subscription_end && new Date(subscription.subscription_end).toLocaleDateString("es-ES")}
                </p>
                <Button
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={handleManageSubscription}
                  disabled={isLoading === "manage"}
                >
                  {isLoading === "manage" ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Gestionar suscripción
                </Button>
              </>
            ) : (
              <Button
                className="w-full rounded-lg bg-primary hover:bg-primary/90"
                onClick={() => handleSubscribe(PLANS.premium.priceId, "premium")}
                disabled={isLoading === "premium"}
              >
                {isLoading === "premium" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {currentPlan === "standard" ? "Actualizar a Premium" : "Comenzar prueba gratuita"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground max-w-4xl mx-auto text-center">
        * La prueba gratuita dura 30 días. Después, se cobrará automáticamente según el plan elegido. 
        Puedes cancelar en cualquier momento desde el{" "}
        <Link to="/configuracion#suscripcion" className="text-blue-500 underline hover:text-blue-600">
          portal de gestión de suscripciones
        </Link>.
      </p>
    </div>
  );
}
