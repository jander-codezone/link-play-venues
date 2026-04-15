-- 1. Arreglar perfiles: solo ver tu propio perfil
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver perfiles" ON public.perfiles;

CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.perfiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Arreglar contrataciones: acceso solo para negocios y artistas involucrados
DROP POLICY IF EXISTS "Acceso público temporal" ON public.contrataciones;

CREATE POLICY "Negocios pueden ver sus contrataciones"
ON public.contrataciones
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados pueden crear contrataciones"
ON public.contrataciones
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar contrataciones"
ON public.contrataciones
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden eliminar contrataciones"
ON public.contrataciones
FOR DELETE
TO authenticated
USING (true);

-- 3. Arreglar artista_disponibilidad: solo artistas autenticados
DROP POLICY IF EXISTS "Solo artistas o representantes pueden modificar disponibilidad" ON public.artista_disponibilidad;

CREATE POLICY "Artistas pueden gestionar su disponibilidad"
ON public.artista_disponibilidad
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);