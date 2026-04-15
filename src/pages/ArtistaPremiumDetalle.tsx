import { Navigate, useParams } from "react-router-dom";

export default function ArtistaPremiumDetalle() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/artistas/${id}`} replace />;
}
