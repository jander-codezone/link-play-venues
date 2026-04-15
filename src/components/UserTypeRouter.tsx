import { useAuth } from "@/contexts/AuthContext";

interface UserTypeRouterProps {
  venue: React.ReactNode;
  artista: React.ReactNode;
}

export function UserTypeRouter({ venue, artista }: UserTypeRouterProps) {
  const { profile } = useAuth();
  
  // If user is artista or representante, show artist view
  if (profile?.tipo_usuario === 'artista' || profile?.tipo_usuario === 'representante') {
    return <>{artista}</>;
  }
  
  // Default to venue view (also for unauthenticated users)
  return <>{venue}</>;
}
