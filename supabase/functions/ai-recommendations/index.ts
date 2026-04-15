import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, negocioId, fechaInicio, fechaFin, presupuestoSemanal } = await req.json();
    console.log("Request received:", { type, negocioId, fechaInicio, fechaFin, presupuestoSemanal });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch negocio data
    const { data: negocio, error: negocioError } = await supabase
      .from("negocios")
      .select("*")
      .eq("id", negocioId)
      .single();

    if (negocioError || !negocio) {
      console.error("Error fetching negocio:", negocioError);
      throw new Error("No se encontró el negocio");
    }
    console.log("Negocio data:", negocio);

    // Fetch available artists (favoritos)
    const { data: artistas, error: artistasError } = await supabase
      .from("artistas")
      .select("*")
      .order("nombre");

    if (artistasError) {
      console.error("Error fetching artistas:", artistasError);
      throw new Error("Error al obtener artistas");
    }
    console.log("Artistas found:", artistas?.length);

    // Fetch past contrataciones for patterns
    const { data: contrataciones, error: contratacionesError } = await supabase
      .from("contrataciones")
      .select("*, artistas(nombre, estilo, cache)")
      .order("fecha", { ascending: false })
      .limit(50);

    if (contratacionesError) {
      console.error("Error fetching contrataciones:", contratacionesError);
    }
    console.log("Contrataciones found:", contrataciones?.length);

    // Build context for AI
    const contexto = {
      negocio: {
        nombre: negocio.nombre,
        tipo: negocio.tipo,
        ubicacion: negocio.ubicacion,
        capacidad: negocio.capacidad,
        estilos_musicales: negocio.estilos_musicales || [],
        dias_apertura: negocio.dias_apertura || [],
        hora_apertura: negocio.hora_apertura,
        hora_cierre: negocio.hora_cierre,
        presupuesto_min: negocio.presupuesto_min,
        presupuesto_max: negocio.presupuesto_max,
      },
      artistas_disponibles: artistas?.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        estilo: a.estilo,
        cache: a.cache,
        tipos_evento: a.tipos_evento,
      })) || [],
      historial_contrataciones: contrataciones?.map((c) => ({
        fecha: c.fecha,
        artista: c.artistas?.nombre,
        estilo: c.artistas?.estilo,
        cache_pagado: c.cache_pagado,
        satisfaccion: c.satisfaccion,
        asistencia: c.asistencia_estimada,
      })) || [],
      presupuesto_semanal: presupuestoSemanal || negocio.presupuesto_max || 10000,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
    };

    const systemPrompt = `Eres un experto en programación musical para locales de ocio nocturno en España. 
Tu tarea es generar una propuesta de programación semanal optimizada que MAXIMICE el uso del presupuesto disponible.

CONTEXTO IMPORTANTE:
- La mayoría de contrataciones son DJs y artistas pequeños/medianos (cachés entre 300€ y 2.000€)
- Los artistas famosos/grandes (cachés altos) son contrataciones puntuales y esporádicas
- Una buena programación combina 1-2 artistas medianos/grandes por semana con varios DJs más económicos

REGLAS DE PROGRAMACIÓN:
1. MAXIMIZAR EL PRESUPUESTO: Intenta usar entre el 85% y 100% del presupuesto semanal disponible
2. Solo programa artistas en los días que el local está abierto (días_apertura del negocio)
3. Los horarios deben estar dentro del rango de apertura del local
4. Distribuye el gasto: combina 1 artista "cabeza de cartel" (más caro) con varios DJs/artistas pequeños
5. Prioriza artistas con estilos que coincidan con las preferencias del negocio
6. Considera el historial de contrataciones: artistas con buena satisfacción son preferidos
7. Varía los estilos a lo largo de la semana para mantener diversidad
8. Si un artista tiene caché muy alto, considera si encaja como "evento especial" de la semana

REGLA CRÍTICA - NO SOLAPAMIENTO DE HORARIOS:
- NUNCA programes dos artistas con horarios que se solapen en el mismo día
- Si hay varios artistas el mismo día, el siguiente artista DEBE empezar DESPUÉS de que termine el anterior
- Ejemplo: si un artista empieza a las 01:00 y dura 210 minutos (3h30m), termina a las 04:30, por lo que el siguiente artista debe empezar a las 04:30 o más tarde, NUNCA antes
- Calcula siempre: hora_fin = hora_sugerida + (duracion_sugerida / 60)
- El siguiente artista debe tener hora_sugerida >= hora_fin del artista anterior

ESTRATEGIA DE DISTRIBUCIÓN DEL PRESUPUESTO:
- 40-60% del presupuesto para el artista principal de la semana (si hay uno destacado)
- 40-60% restante repartido entre DJs y artistas más pequeños para los demás días
- Si el presupuesto es limitado, prioriza cantidad de días cubiertos sobre artistas famosos

Responde SOLO con un JSON válido con esta estructura exacta:
{
  "programacion": [
    {
      "fecha": "YYYY-MM-DD",
      "artista_id": "uuid del artista",
      "nombre": "nombre del artista",
      "hora_sugerida": 23 (número de hora, ej: 23 para las 23:00),
      "duracion_sugerida": 120 (minutos),
      "cache_estimado": 500 (euros),
      "razon": "breve explicación de por qué este artista este día"
    }
  ],
  "presupuesto_total": 2500,
  "resumen": "Resumen de la propuesta explicando cómo se ha distribuido el presupuesto"
}`;

    const userPrompt = `Genera una programación semanal para este negocio:

INFORMACIÓN DEL NEGOCIO:
${JSON.stringify(contexto.negocio, null, 2)}

ARTISTAS DISPONIBLES:
${JSON.stringify(contexto.artistas_disponibles, null, 2)}

HISTORIAL DE CONTRATACIONES (para referencia de patrones):
${JSON.stringify(contexto.historial_contrataciones.slice(0, 10), null, 2)}

PARÁMETROS:
- Presupuesto semanal máximo: ${contexto.presupuesto_semanal}€
- Período: del ${fechaInicio} al ${fechaFin}

Genera la propuesta de programación.`;

    console.log("Calling Lovable AI...");
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, espera un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos agotados. Añade más créditos en la configuración." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No se recibió respuesta del modelo");
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const result = JSON.parse(jsonStr);
    console.log("Parsed result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in ai-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
