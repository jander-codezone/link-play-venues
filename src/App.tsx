import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { UserTypeRouter } from "@/components/UserTypeRouter";

// Venue pages
import Dashboard from "@/pages/Dashboard";
import Calendario from "@/pages/Calendario";
import Artistas from "@/pages/Artistas";
import ArtistaDetalle from "@/pages/ArtistaDetalle";
import ArtistasPremium from "@/pages/ArtistasPremium";
import ArtistaPremiumDetalle from "@/pages/ArtistaPremiumDetalle";
import ArtistasFavoritos from "@/pages/ArtistasFavoritos";
import Contrataciones from "@/pages/Contrataciones";
import Facturacion from "@/pages/Facturacion";
import Notificaciones from "@/pages/Notificaciones";
import Configuracion from "@/pages/Configuracion";
import Suscripciones from "@/pages/Suscripciones";

// Artist pages
import ArtistaDashboard from "@/pages/artista/ArtistaDashboard";
import ArtistaCalendario from "@/pages/artista/ArtistaCalendario";
import ArtistaContrataciones from "@/pages/artista/ArtistaContrataciones";
import ArtistaFacturacion from "@/pages/artista/ArtistaFacturacion";
import ArtistaNotificaciones from "@/pages/artista/ArtistaNotificaciones";
import ArtistaSuscripciones from "@/pages/artista/ArtistaSuscripciones";
import ArtistaConfiguracion from "@/pages/artista/ArtistaConfiguracion";

// Shared pages
import Auth from "@/pages/Auth";
import AuthCallback from "@/pages/AuthCallback";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth routes - no layout */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<UserTypeRouter venue={<Dashboard />} artista={<ArtistaDashboard />} />} />
              <Route path="/dashboard" element={<UserTypeRouter venue={<Dashboard />} artista={<ArtistaDashboard />} />} />
              
              {/* Venue-only routes */}
              <Route path="/artistas" element={<Artistas />} />
              <Route path="/artistas/:id" element={<ArtistaDetalle />} />
              <Route path="/artistas/premium" element={<ArtistasPremium />} />
              <Route path="/artistas/premium/:id" element={<ArtistaPremiumDetalle />} />
              <Route path="/artistas/favoritos" element={<ArtistasFavoritos />} />
              
              {/* Shared routes with different views */}
              <Route path="/calendario" element={<UserTypeRouter venue={<Calendario />} artista={<ArtistaCalendario />} />} />
              <Route path="/contrataciones" element={<UserTypeRouter venue={<Contrataciones />} artista={<ArtistaContrataciones />} />} />
              <Route path="/facturacion" element={<UserTypeRouter venue={<Facturacion />} artista={<ArtistaFacturacion />} />} />
              <Route path="/notificaciones" element={<UserTypeRouter venue={<Notificaciones />} artista={<ArtistaNotificaciones />} />} />
              <Route path="/suscripciones" element={<UserTypeRouter venue={<Suscripciones />} artista={<ArtistaSuscripciones />} />} />
              <Route path="/configuracion" element={<UserTypeRouter venue={<Configuracion />} artista={<ArtistaConfiguracion />} />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
