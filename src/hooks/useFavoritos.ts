import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "artistas-favoritos";

export function useFavoritos() {
  const [favoritos, setFavoritos] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritos));
  }, [favoritos]);

  const toggleFavorito = useCallback((id: string) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  }, []);

  const isFavorito = useCallback(
    (id: string) => favoritos.includes(id),
    [favoritos]
  );

  const removeFavorito = useCallback((id: string) => {
    setFavoritos((prev) => prev.filter((fav) => fav !== id));
  }, []);

  return { favoritos, toggleFavorito, isFavorito, removeFavorito };
}
