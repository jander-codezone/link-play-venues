import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EventoNotificacion {
  evento_id: string;
  artista_id: string;
  artista_nombre: string;
  artista_email: string | null;
  fecha: string;
  hora_inicio: number;
  duracion: number;
}

interface NotificationRequest {
  eventos: EventoNotificacion[];
  negocio_nombre: string;
}

const formatearHora = (minutos: number): string => {
  const h = Math.floor(minutos / 60) % 24;
  const m = minutos % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

const formatearFecha = (fecha: string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventos, negocio_nombre }: NotificationRequest = await req.json();

    console.log(`Procesando ${eventos.length} notificaciones para ${negocio_nombre}`);

    const resultados = {
      notificaciones_creadas: 0,
      emails_enviados: 0,
      errores: [] as string[],
    };

    for (const evento of eventos) {
      // 1. Crear notificación in-app
      const { error: notifError } = await supabase
        .from("notificaciones")
        .insert({
          artista_id: evento.artista_id,
          evento_id: evento.evento_id,
          tipo: "propuesta_contratacion",
          titulo: `Nueva propuesta de ${negocio_nombre}`,
          mensaje: `${negocio_nombre} te quiere contratar para el ${formatearFecha(evento.fecha)} a las ${formatearHora(evento.hora_inicio)} (${evento.duracion} minutos).`,
          leida: false,
        });

      if (notifError) {
        console.error("Error creando notificación:", notifError);
        resultados.errores.push(`Error notificación para ${evento.artista_nombre}: ${notifError.message}`);
      } else {
        resultados.notificaciones_creadas++;
      }

      // 2. Enviar email si hay API key y el artista tiene email
      if (resendApiKey && evento.artista_email) {
        try {
          const { Resend } = await import("https://esm.sh/resend@2.0.0");
          const resend = new Resend(resendApiKey);

          const emailResponse = await resend.emails.send({
            from: "LinkPlay <onboarding@resend.dev>",
            to: [evento.artista_email],
            subject: `Nueva propuesta de contratación - ${negocio_nombre}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #8B5CF6;">¡Nueva propuesta de contratación!</h1>
                <p>Hola ${evento.artista_nombre},</p>
                <p><strong>${negocio_nombre}</strong> quiere contratarte para actuar:</p>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>📅 Fecha:</strong> ${formatearFecha(evento.fecha)}</p>
                  <p><strong>🕐 Hora:</strong> ${formatearHora(evento.hora_inicio)}</p>
                  <p><strong>⏱️ Duración:</strong> ${evento.duracion} minutos</p>
                </div>
                <p>Accede a tu panel de LinkPlay para confirmar o rechazar esta propuesta.</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                  Este email fue enviado automáticamente por LinkPlay.
                </p>
              </div>
            `,
          });

          console.log("Email enviado:", emailResponse);
          resultados.emails_enviados++;
        } catch (emailError: unknown) {
          console.error("Error enviando email:", emailError);
          const message = emailError instanceof Error ? emailError.message : "Error desconocido";
          resultados.errores.push(`Error email para ${evento.artista_nombre}: ${message}`);
        }
      } else if (!resendApiKey) {
        console.log("RESEND_API_KEY no configurada, omitiendo envío de email");
      } else if (!evento.artista_email) {
        console.log(`Artista ${evento.artista_nombre} no tiene email configurado`);
      }
    }

    console.log("Resultados:", resultados);

    return new Response(JSON.stringify(resultados), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error en send-notifications:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
