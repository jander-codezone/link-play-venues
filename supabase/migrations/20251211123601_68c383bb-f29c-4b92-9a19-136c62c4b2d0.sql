-- Add invoice column to eventos table
ALTER TABLE public.eventos 
ADD COLUMN factura_url TEXT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.eventos.factura_url IS 'URL or path to the generated invoice for this event';