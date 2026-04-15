-- Eliminar políticas permisivas de artista_disponibilidad
DROP POLICY IF EXISTS "Acceso público temporal" ON public.artista_disponibilidad;
DROP POLICY IF EXISTS "Excepciones visibles para todos" ON public.artista_disponibilidad;

-- Crear políticas restrictivas
CREATE POLICY "Usuarios autenticados pueden ver disponibilidad"
ON public.artista_disponibilidad
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo artistas o representantes pueden modificar disponibilidad"
ON public.artista_disponibilidad
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- También arreglar artista_disponibilidad_premium
DROP POLICY IF EXISTS "Gestión disponibilidad premium" ON public.artista_disponibilidad_premium;

CREATE POLICY "Solo artistas o representantes pueden gestionar disponibilidad premium"
ON public.artista_disponibilidad_premium
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Y artista_disponibilidad_semanal
DROP POLICY IF EXISTS "Acceso completo temporal" ON public.artista_disponibilidad_semanal;

CREATE POLICY "Solo artistas o representantes pueden gestionar disponibilidad semanal"
ON public.artista_disponibilidad_semanal
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);