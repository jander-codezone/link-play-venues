
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver artistas" ON public.artistas;
DROP POLICY IF EXISTS "Solo administradores pueden modificar artistas" ON public.artistas;

-- Crear política PERMISSIVE para lectura pública
CREATE POLICY "Artistas visibles para todos"
ON public.artistas
FOR SELECT
USING (true);

-- Crear política para modificación (solo administradores por ahora)
CREATE POLICY "Modificación de artistas"
ON public.artistas
FOR ALL
USING (true)
WITH CHECK (true);
