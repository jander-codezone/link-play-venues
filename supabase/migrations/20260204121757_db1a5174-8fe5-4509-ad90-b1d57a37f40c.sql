-- Crear función para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, nombre, email, tipo_usuario, telefono, subtipo_venue)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.email),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'tipo_usuario')::user_type, 'venue'::user_type),
    NEW.raw_user_meta_data->>'telefono',
    (NEW.raw_user_meta_data->>'subtipo_venue')::venue_subtype
  );
  RETURN NEW;
END;
$$;

-- Crear trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Actualizar política de INSERT para permitir que el trigger funcione
DROP POLICY IF EXISTS "Usuarios pueden insertar su propio perfil" ON public.user_profiles;

CREATE POLICY "Sistema puede crear perfiles"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (true);