-- Tabla para almacenar preferencias aprendidas del negocio
-- Requerida por la Edge Function ai-recommendations (usada desde link-play-pro)
CREATE TABLE public.negocio_preferencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL REFERENCES public.negocios(id) ON DELETE CASCADE,
  tipo_preferencia TEXT NOT NULL,
  valor TEXT NOT NULL,
  peso NUMERIC DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(negocio_id, tipo_preferencia, valor)
);

ALTER TABLE public.negocio_preferencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver preferencias de negocio"
ON public.negocio_preferencias
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden gestionar preferencias de negocio"
ON public.negocio_preferencias
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE TRIGGER update_negocio_preferencias_updated_at
  BEFORE UPDATE ON public.negocio_preferencias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
