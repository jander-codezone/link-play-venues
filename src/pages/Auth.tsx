import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Music, Building2, Users, Loader2, MapPin, Mic2 } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');
const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

type UserType = 'venue' | 'artista' | 'representante';
type VenueSubtype = 'contratante' | 'espacio' | 'ambos';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, user, profile, loading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerNombre, setRegisterNombre] = useState('');
  const [registerTelefono, setRegisterTelefono] = useState('');
  const [registerTipo, setRegisterTipo] = useState<UserType>('venue');
  const [registerSubtipoVenue, setRegisterSubtipoVenue] = useState<VenueSubtype>('contratante');

  // Redirect if already logged in
  useEffect(() => {
    if (user && profile && !loading) {
      redirectByUserType(profile.tipo_usuario);
    }
  }, [user, profile, loading]);

  const redirectByUserType = (tipo: UserType) => {
    switch (tipo) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast({
          title: 'Error de validación',
          description: err.errors[0].message,
          variant: 'destructive'
        });
        return;
      }
    }

    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas' 
          : error.message,
        variant: 'destructive'
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      emailSchema.parse(registerEmail);
      passwordSchema.parse(registerPassword);
      if (!registerNombre.trim()) {
        throw new Error('El nombre es obligatorio');
      }
    } catch (err) {
      toast({
        title: 'Error de validación',
        description: err instanceof z.ZodError ? err.errors[0].message : (err as Error).message,
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      registerEmail, 
      registerPassword, 
      registerNombre, 
      registerTipo, 
      registerTelefono,
      registerTipo === 'venue' ? registerSubtipoVenue : undefined
    );
    setIsLoading(false);

    if (error) {
      const errorMessage = error.message.includes('already registered')
        ? 'Este email ya está registrado'
        : error.message;
      toast({
        title: 'Error al registrarse',
        description: errorMessage,
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Registro exitoso',
        description: 'Por favor, verifica tu email para confirmar tu cuenta.',
      });
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      toast({
        title: 'Error con Google',
        description: error.message,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Link&Play</CardTitle>
          <CardDescription>
            Conecta venues con artistas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="register">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Iniciar sesión
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nombre">Nombre</Label>
                  <Input
                    id="register-nombre"
                    type="text"
                    placeholder="Tu nombre o nombre del negocio"
                    value={registerNombre}
                    onChange={(e) => setRegisterNombre(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="tu@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-telefono">Teléfono (opcional)</Label>
                  <Input
                    id="register-telefono"
                    type="tel"
                    placeholder="+34 600 000 000"
                    value={registerTelefono}
                    onChange={(e) => setRegisterTelefono(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Contraseña</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de cuenta</Label>
                  <Select value={registerTipo} onValueChange={(v) => setRegisterTipo(v as UserType)}>
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

                {/* Venue subtype selector - only shown when venue is selected */}
                {registerTipo === 'venue' && (
                  <div className="space-y-2 p-4 bg-muted/50 rounded-lg border border-border">
                    <Label className="text-sm font-medium">¿Qué tipo de venue eres?</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setRegisterSubtipoVenue('contratante')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          registerSubtipoVenue === 'contratante' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Mic2 className={`h-5 w-5 ${registerSubtipoVenue === 'contratante' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium text-sm">Contratante</p>
                          <p className="text-xs text-muted-foreground">Busco artistas para mi local</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterSubtipoVenue('espacio')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          registerSubtipoVenue === 'espacio' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <MapPin className={`h-5 w-5 ${registerSubtipoVenue === 'espacio' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium text-sm">Espacio de eventos</p>
                          <p className="text-xs text-muted-foreground">Ofrezco mi espacio para eventos (arena, teatro, sala...)</p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegisterSubtipoVenue('ambos')}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          registerSubtipoVenue === 'ambos' 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <Building2 className={`h-5 w-5 ${registerSubtipoVenue === 'ambos' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <p className="font-medium text-sm">Ambos</p>
                          <p className="text-xs text-muted-foreground">Contrato artistas y también alquilo mi espacio</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Crear cuenta
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">O continúa con</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
