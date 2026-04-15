-- ============================================================
-- Migración: campos extendidos para artistas representados
-- Fecha: 2026-03-16
-- Qué hace:
--   1. Añade columnas de caché mínimo/máximo y disponibilidad
--      geográfica a la tabla `artistas`.
--   2. Crea tabla `artista_rider_template` para el rider por
--      defecto de cada artista (se auto-puebla al crear una oferta).
-- ============================================================

-- 1. Campos extendidos en artistas
ALTER TABLE artistas
  ADD COLUMN IF NOT EXISTS cache_min     numeric,
  ADD COLUMN IF NOT EXISTS cache_max     numeric,
  ADD COLUMN IF NOT EXISTS ambito_geografico  text,           -- 'nacional' | 'internacional' | 'ciudades_concretas'
  ADD COLUMN IF NOT EXISTS ciudades_disponibles  text[];       -- array de nombres de ciudad

-- 2. Tabla de rider template por artista (uno por artista, reemplazable)
CREATE TABLE IF NOT EXISTS artista_rider_template (
  id                              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artista_id                      uuid NOT NULL UNIQUE REFERENCES artistas(id) ON DELETE CASCADE,

  -- Rider técnico
  technical_requires_cdjs         boolean NOT NULL DEFAULT false,
  technical_requires_mixer        boolean NOT NULL DEFAULT false,
  technical_requires_monitors     boolean NOT NULL DEFAULT false,
  technical_requires_microphone   boolean NOT NULL DEFAULT false,
  technical_requires_sound_engineer boolean NOT NULL DEFAULT false,
  technical_requires_lighting     boolean NOT NULL DEFAULT false,
  technical_requires_dj_booth     boolean NOT NULL DEFAULT false,
  technical_requires_power_access boolean NOT NULL DEFAULT false,
  technical_additional_notes      text,

  -- Rider de hospitality
  hospitality_requires_hotel            boolean NOT NULL DEFAULT false,
  hospitality_requires_catering         boolean NOT NULL DEFAULT false,
  hospitality_requires_dressing_room    boolean NOT NULL DEFAULT false,
  hospitality_requires_beverages        boolean NOT NULL DEFAULT false,
  hospitality_requires_ground_transport boolean NOT NULL DEFAULT false,
  hospitality_requires_security_access  boolean NOT NULL DEFAULT false,
  hospitality_requires_towels           boolean NOT NULL DEFAULT false,
  hospitality_beverages_detail          text,
  hospitality_catering_detail           text,
  hospitality_clothing_detail           text,
  hospitality_additional_notes          text,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE artista_rider_template ENABLE ROW LEVEL SECURITY;

-- El artista y su representante pueden gestionar su rider template
CREATE POLICY "artista_representante_manage_rider_template"
  ON artista_rider_template
  FOR ALL
  USING (
    artista_id IN (
      SELECT a.id
      FROM   artistas a
      INNER JOIN perfiles p
        ON (p.id = a.perfil_artista_id OR p.id = a.representante_id)
      WHERE p.user_id = auth.uid()
    )
  );

-- Los venues pueden leer el rider template (para pre-rellenar contratos/ofertas)
CREATE POLICY "venues_read_rider_template"
  ON artista_rider_template
  FOR SELECT
  USING (true);

-- Índice para lookups rápidos por artista
CREATE INDEX IF NOT EXISTS artista_rider_template_artista_id_idx
  ON artista_rider_template (artista_id);
