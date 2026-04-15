import { formatNumberWithDots } from "@/lib/formatNumber";

/**
 * Tipo mínimo que describe los campos de precio de un artista.
 * cache_min/cache_max son campos añadidos via migración (tipos.ts puede estar desactualizado).
 */
export interface ArtistaPriceable {
  cache?: number | null;
  cache_min?: number | null;
  cache_max?: number | null;
  pricing_visibility?: string | null;
}

/**
 * Devuelve la representación canónica del precio de un artista.
 *
 * Prioridad:
 *  1. "Bajo solicitud" si pricing_visibility === "hidden"
 *  2. Rango "X€ – Y€" si cache_min y cache_max están disponibles
 *  3. Valor único "X€" si solo existe cache (legacy)
 *  4. "A consultar" como fallback final
 */
export function getArtistPriceRangeDisplay(artista: ArtistaPriceable): string {
  if (artista.pricing_visibility === "hidden") return "Bajo solicitud";

  const cacheMin = Number(artista.cache_min);
  const cacheMax = Number(artista.cache_max);
  if (cacheMin > 0 && cacheMax > 0) {
    return `${formatNumberWithDots(cacheMin)}€ – ${formatNumberWithDots(cacheMax)}€`;
  }

  const cache = Number(artista.cache);
  if (cache > 0) {
    return `${formatNumberWithDots(cache)}€`;
  }

  return "A consultar";
}

/**
 * Devuelve la etiqueta en español para la categoría de un artista.
 */
export function getArtistCategoryLabel(categoria?: string | null): string {
  const cat = String(categoria || "").trim().toLowerCase();
  if (cat === "standard") return "Estándar";
  if (cat === "premium") return "Premium";
  return categoria || "";
}

/**
 * Classifica un artista como estándar o premium.
 *
 * Orden de prioridad:
 *  1. Campo `categoria` en DB cuando existe y es reconocido ("standard" | "premium")
 *  2. Fallback por nombre para artistas legacy sin `categoria` asignada en DB
 *
 * El listado de nombres está encapsulado aquí. Una vez que todos los registros
 * tengan `categoria` correctamente asignado, esta lista se vuelve código muerto
 * y puede eliminarse sin cambiar la API.
 */

// Nombres de artistas que son tier standard pero pueden tener `categoria` nulo en la DB.
const LEGACY_STANDARD_NAMES: ReadonlySet<string> = new Set([
  "dimelo flow",
  "budha",
  "felix klain",
]);

export function isStandardArtist(artista: {
  nombre: string;
  categoria?: string | null;
}): boolean {
  const cat = String(artista.categoria || "").trim().toLowerCase();
  if (cat === "standard") return true;
  if (cat === "premium") return false;
  // Fallback para rows donde categoria es null / vacío
  return LEGACY_STANDARD_NAMES.has(artista.nombre.trim().toLowerCase());
}
