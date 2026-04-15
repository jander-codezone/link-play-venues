-- Arreglar tabla perfiles
DROP POLICY IF EXISTS "Perfiles visibles para todos" ON public.perfiles;
DROP POLICY IF EXISTS "Usuarios pueden editar su perfil" ON public.perfiles;

CREATE POLICY "Usuarios autenticados pueden ver perfiles"
ON public.perfiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios pueden editar su propio perfil"
ON public.perfiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar su propio perfil"
ON public.perfiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);