import * as React from "react";
import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, Calendar, Users, FileText, Receipt, Bell, Settings, ChevronDown, Crown, Heart, LogOut, LogIn, CreditCard, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import logoLinkPlay from "@/assets/logo-linkplay.png";

const artistasSubmenu = [
  { name: "Estándar", href: "/artistas", icon: Users },
  { name: "Premium", href: "/artistas/premium", icon: Crown },
  { name: "Favoritos", href: "/artistas/favoritos", icon: Heart },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const isArtistasActive = location.pathname.startsWith("/artistas");
  const [artistasOpen, setArtistasOpen] = useState(isArtistasActive);
  
  const isArtistaUser = profile?.tipo_usuario === 'artista' || profile?.tipo_usuario === 'representante';

  useEffect(() => {
    if (isArtistasActive) setArtistasOpen(true);
  }, [isArtistasActive]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getSubtitle = () => {
    switch (profile?.tipo_usuario) {
      case 'venue': return 'Venues';
      case 'artista': return 'Artists';
      case 'representante': return 'Representantes';
      default: return 'Venues';
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) => cn(
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
    isActive ? "bg-[#2a2a2a] text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
  );

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#1a1a1a] border-r border-[#2a2a2a]">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center px-6 pt-6 pb-4">
          <img src={logoLinkPlay} alt="Link & Play" className="h-14 w-auto object-contain" />
          <span className="italic text-[#bab6ab] text-[13px] tracking-wide mt-2">{getSubtitle()}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="space-y-1">
            <NavLink to="/" end className={linkClass}>
              <LayoutGrid className="h-5 w-5" />
              Dashboard
            </NavLink>

            {/* Venue-only: Artistas submenu */}
            {!isArtistaUser && (
              <Collapsible open={artistasOpen} onOpenChange={setArtistasOpen}>
                <CollapsibleTrigger className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isArtistasActive ? "bg-[#2a2a2a] text-primary" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5" />
                    Artistas
                  </div>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", artistasOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 ml-8 space-y-1">
                  {artistasSubmenu.map(item => (
                    <NavLink key={item.href} to={item.href} end={item.href === "/artistas"} className={({ isActive }) => cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
                      isActive ? "text-primary font-medium" : "text-white/50 hover:text-white/80"
                    )}>
                      <item.icon className="h-4 w-4" />
                      {item.name}
                    </NavLink>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            <NavLink to="/calendario" className={linkClass}>
              <Calendar className="h-5 w-5" />
              Calendario
            </NavLink>

            <NavLink to="/contrataciones" className={linkClass}>
              {isArtistaUser ? <Briefcase className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
              Contrataciones
            </NavLink>

            <NavLink to="/facturacion" className={linkClass}>
              <Receipt className="h-5 w-5" />
              Facturación
            </NavLink>

            <NavLink to="/notificaciones" className={linkClass}>
              <Bell className="h-5 w-5" />
              Notificaciones
            </NavLink>

            <NavLink to="/suscripciones" className={linkClass}>
              <CreditCard className="h-5 w-5" />
              Suscripciones
            </NavLink>
          </div>
        </nav>

        {/* Settings */}
        <div className="px-4 py-3 border-t border-[#2a2a2a]">
          <NavLink to="/configuracion" className={linkClass}>
            <Settings className="h-5 w-5" />
            Configuración
          </NavLink>
        </div>

        {/* User Profile */}
        <div className="border-t border-[#2a2a2a] p-4">
          {user && profile ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                {profile.foto_url && <AvatarImage src={profile.foto_url} alt={profile.nombre} />}
                <AvatarFallback className="bg-[#2a2a2a] text-white font-medium text-sm">
                  {getInitials(profile.nombre)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{profile.nombre}</p>
                <p className="text-xs text-white/50 truncate">{profile.email || user.email}</p>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-colors" title="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all">
              <LogIn className="h-5 w-5" />
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
