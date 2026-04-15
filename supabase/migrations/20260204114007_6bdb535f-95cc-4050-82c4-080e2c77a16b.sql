-- Create enum for venue subtypes
CREATE TYPE public.venue_subtype AS ENUM ('contratante', 'espacio', 'ambos');

-- Add subtipo_venue column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN subtipo_venue public.venue_subtype;

-- Create table for venue spaces with all their details
CREATE TABLE public.espacios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- arena, sala, teatro, club, etc.
  capacidad_maxima INTEGER,
  ubicacion TEXT,
  ciudad TEXT,
  direccion TEXT,
  descripcion TEXT,
  
  -- Technical equipment
  tiene_sonido BOOLEAN DEFAULT false,
  tiene_iluminacion BOOLEAN DEFAULT false,
  tiene_camerinos BOOLEAN DEFAULT false,
  tiene_backline BOOLEAN DEFAULT false,
  equipamiento_adicional TEXT,
  
  -- Pricing
  tarifa_base NUMERIC,
  tarifa_por_hora NUMERIC,
  moneda TEXT DEFAULT 'EUR',
  condiciones_alquiler TEXT,
  
  -- Media
  fotos_urls TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.espacios ENABLE ROW LEVEL SECURITY;

-- RLS Policies for espacios
-- Anyone can view available spaces
CREATE POLICY "Espacios visibles para todos"
ON public.espacios
FOR SELECT
USING (true);

-- Users can manage their own spaces
CREATE POLICY "Usuarios pueden gestionar sus espacios"
ON public.espacios
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create availability table for spaces
CREATE TABLE public.espacio_disponibilidad (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  espacio_id UUID NOT NULL REFERENCES public.espacios(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  disponible BOOLEAN DEFAULT true,
  hora_inicio TIME,
  hora_fin TIME,
  tarifa_especial NUMERIC,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(espacio_id, fecha)
);

-- Enable RLS for availability
ALTER TABLE public.espacio_disponibilidad ENABLE ROW LEVEL SECURITY;

-- Anyone can see availability
CREATE POLICY "Disponibilidad visible para todos"
ON public.espacio_disponibilidad
FOR SELECT
USING (true);

-- Space owners can manage availability
CREATE POLICY "Propietarios pueden gestionar disponibilidad"
ON public.espacio_disponibilidad
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.espacios
    WHERE espacios.id = espacio_id
    AND espacios.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.espacios
    WHERE espacios.id = espacio_id
    AND espacios.user_id = auth.uid()
  )
);

-- Add trigger for updated_at on espacios
CREATE TRIGGER update_espacios_updated_at
BEFORE UPDATE ON public.espacios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on espacio_disponibilidad
CREATE TRIGGER update_espacio_disponibilidad_updated_at
BEFORE UPDATE ON public.espacio_disponibilidad
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();