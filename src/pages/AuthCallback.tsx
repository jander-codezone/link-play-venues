import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Music, Building2, Users } from 'lucide-react';

type UserType = 'venue' | 'artista' | 'representante';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [needsProfile, setNeedsProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipo, setTipo] = useState<UserType>('venue');

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate('/auth');
        return;
      }

      setUserId(session.user.id);
      setUserEmail(session.user.email || null);
      setNombre(session.user.user_metadata?.full_name || session.user.user_metadata?.name || '');

      // Check if profile exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profile) {
        // Profile exists, redirect based on type
        redirectByUserType(profile.tipo_usuario as UserType);
      } else {
        // Need to create profile
        setNeedsProfile(true);
        setIsLoading(false);
      }
    };

    handleCallback();
  }, []);

  const redirectByUserType = (userType: UserType) => {
    switch (userType) {
      case 'venue':
        navigate('/dashboard');
        break;
      case 'artista':
      case 'representante':
        navigate('/artistas');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !nombre.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre es obligatorio',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: userId,
        nombre,
        email: userEmail,
        telefono: telefono || null,
        tipo_usuario: tipo
      });

    if (error) {
      toast({
        title: 'Error al crear perfil',
        description: error.message,
        variant: 'destructive'
      });
      setIsSaving(false);
    } else {
      redirectByUserType(tipo);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (needsProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Completa tu perfil</CardTitle>
            <CardDescription>
              Necesitamos algunos datos más para configurar tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre o nombre del negocio"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono (opcional)</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+34 600 000 000"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as UserType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>Venue (sala, bar, club)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="artista">
                      <div className="flex items-center gap-2">
                        <Music className="h-4 w-4" />
                        <span>Artista</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="representante">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Representante</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Completar registro
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
