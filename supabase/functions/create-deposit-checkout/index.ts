import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: unknown) => {
  const detailsStr = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-DEPOSIT-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    log("Function started");

    // Autenticación requerida
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user?.email) throw new Error("User not authenticated");
    log("User authenticated", { email: user.email });

    const { paymentId } = await req.json();
    if (!paymentId) throw new Error("paymentId is required");
    log("Processing payment", { paymentId });

    // Buscar el registro de pago
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("deal_payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) throw new Error("Payment record not found");
    if (payment.payment_type !== "deposit") throw new Error("Only deposit payments are supported");
    if (payment.status === "paid") throw new Error("This payment has already been completed");
    if (payment.status === "cancelled" || payment.status === "refunded") {
      throw new Error(`Payment cannot be processed (status: ${payment.status})`);
    }
    log("Payment validated", { amount: payment.amount, currency: payment.currency });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2025-08-27.basil",
    });

    // Idempotencia: si ya existe una sesión de Checkout abierta, devolverla
    if (payment.provider_checkout_session_id) {
      log("Checking existing checkout session", {
        sessionId: payment.provider_checkout_session_id,
      });
      try {
        const existing = await stripe.checkout.sessions.retrieve(
          payment.provider_checkout_session_id
        );
        if (existing.status === "open") {
          log("Returning existing open session");
          return new Response(JSON.stringify({ url: existing.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        log("Existing session expired or completed, creating new one");
      } catch {
        log("Existing session not found in Stripe, creating new one");
      }
    }

    // Datos del deal para la descripción
    const { data: deal } = await supabaseAdmin
      .from("booking_deals")
      .select("venue_name,event_date,artist_id")
      .eq("id", payment.booking_deal_id)
      .single();

    // Buscar o crear cliente Stripe por email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      log("Existing Stripe customer found", { customerId });
    }

    const amountInCents = Math.round(payment.amount * 100);
    if (amountInCents < 50) throw new Error("Deposit amount too small for Stripe (min 0.50€)");

    const origin = req.headers.get("origin") || "https://app.linkplay.com";
    const currency = (payment.currency || "eur").toLowerCase();

    const description = deal
      ? `Adelanto para ${deal.venue_name}${deal.event_date ? ` — ${deal.event_date}` : ""}`
      : "Adelanto de contratación Link&Play";

    log("Creating Stripe Checkout session", { amountInCents, currency });

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: "Adelanto de contratación",
              description,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/contrataciones?stripe=success`,
      cancel_url: `${origin}/contrataciones?stripe=cancel`,
      metadata: {
        payment_id: paymentId,
        booking_deal_id: payment.booking_deal_id,
      },
    });

    log("Checkout session created", { sessionId: session.id });

    // Persistir el session ID para idempotencia futura
    await supabaseAdmin
      .from("deal_payments")
      .update({
        provider: "stripe",
        provider_checkout_session_id: session.id,
        payment_link_url: session.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", paymentId);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
