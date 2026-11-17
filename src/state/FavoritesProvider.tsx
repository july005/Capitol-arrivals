import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Storage from '@/lib/storage';
import type { Place } from '@/lib/types';

const KEY = 'capital-arrivals.favorites.v1';

type FavoritesContextValue = {
  favorites: Place[];
  loading: boolean;
  isFavorite: (kind: Place['kind'], id: string) => boolean;
  toggleFavorite: (place: Place) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function isPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<Place>;
  return (item.kind === 'rail' || item.kind === 'bus') &&
    typeof item.id === 'string' && typeof item.name === 'string';
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Storage.getItem(KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const saved: unknown = JSON.parse(raw);
        if (Array.isArray(saved)) setFavorites(saved.filter(isPlace));
      })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const isFavorite = useCallback((kind: Place['kind'], id: string) =>
    favorites.some((item) => item.kind === kind && item.id === id), [favorites]);

  const toggleFavorite = useCallback((place: Place) => {
    setFavorites((current) => {
      const exists = current.some((item) => item.kind === place.kind && item.id === place.id);
      const updated = exists
        ? current.filter((item) => !(item.kind === place.kind && item.id === place.id))
        : [place, ...current];
      // This data never leaves the device. Save the latest immutable snapshot.
      Storage.setItem(KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const value = useMemo(() => ({ favorites, loading, isFavorite, toggleFavorite }),
    [favorites, loading, isFavorite, toggleFavorite]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('FavoritesProvider is missing.');
  return context;
}
