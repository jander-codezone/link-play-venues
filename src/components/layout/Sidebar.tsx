import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Users,
  Calendar,
  FileText,
  Receipt,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronDown,
  Crown,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState, useEffect } from "react";

const mainNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Contrataciones", href: "/contrataciones", icon: FileText },
  { name: "Facturación", href: "/facturacion", icon: Receipt },
];

const artistasSubmenu = [
  { name: "Estándar", href: "/artistas" },
  { name: "Premium", href: "/artistas/premium" },
  { name: "Favoritos", href: "/artistas/favoritos" },
];

export function Sidebar() {
  const location = useLocation();
  const isArtistasActive = location.pathname.startsWith("/artistas");
  const [artistasOpen, setArtistasOpen] = useState(isArtistasActive);

  useEffect(() => {
    if (isArtistasActive) setArtistasOpen(true);
  }, [isArtistasActive]);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 gradient-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center justify-center px-4 border-b border-sidebar-border">
          <h1 className="text-2xl font-bold text-sidebar-primary">Link&Play</h1>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="px-3 mb-2 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
            Tu centro de control
          </p>

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </NavLink>

          <Collapsible open={artistasOpen} onOpenChange={setArtistasOpen}>
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isArtistasActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5" />
                Artistas
              </div>
              <ChevronDown
                className={cn("h-4 w-4 transition-transform duration-200", artistasOpen && "rotate-180")}
              />
            </CollapsibleTrigger>

            <CollapsibleContent className="pl-4 mt-1 space-y-1">
              {artistasSubmenu.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end={item.href === "/artistas"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent/70 text-sidebar-primary"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )
                  }
                >
                  {item.name === "Premium" && <Crown className="h-4 w-4" />}
                  {item.name === "Favoritos" && <Heart className="h-4 w-4" />}
                  {item.name === "Estándar" && <Users className="h-4 w-4" />}
                  {item.name}
                </NavLink>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {mainNavigation.slice(1).map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-sidebar-border px-3 py-4 space-y-1">
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )
            }
          >
            <Settings className="h-5 w-5" />
            Configuración
          </NavLink>
        </div>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-sidebar-primary/20">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=club" />
              <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">CC</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Fitz Club</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">club@copacabana.es</p>
            </div>

            <button className="p-2 rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}