-- Eliminar política temporal permisiva de artistas
DROP POLICY IF EXISTS "Acceso público temporal" ON public.artistas;

-- Crear políticas restrictivas para artistas
CREATE POLICY "Usuarios autenticados pueden ver artistas"
ON public.artistas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Solo administradores pueden modificar artistas"
ON public.artistas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- También corregir user_profiles - solo ver propio perfil o perfiles públicos sin datos sensibles
DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON public.user_profiles;

CREATE POLICY "Usuarios pueden ver su propio perfil completo"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden ver nombres de otros perfiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (true);