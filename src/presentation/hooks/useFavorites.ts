"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cinerender:favoritos";
const MAX_FAVORITES = 50;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMPTY: readonly string[] = Object.freeze([]);

/**
 * Store de favoritos persistido en localStorage (Observer + Singleton).
 * Todo lo que se lee de localStorage se valida: el usuario (o una extensión)
 * puede haberlo modificado, así que se trata como entrada no confiable.
 */
class FavoritesStore {
  private listeners = new Set<() => void>();
  private snapshot: readonly string[] = EMPTY;
  private loaded = false;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        this.loaded = false;
        listener();
      }
    };
    window.addEventListener("storage", onStorage); // sincroniza entre pestañas
    return () => {
      this.listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  };

  getSnapshot = (): readonly string[] => {
    if (!this.loaded) {
      this.snapshot = Object.freeze(this.read());
      this.loaded = true;
    }
    return this.snapshot;
  };

  getServerSnapshot = (): readonly string[] => EMPTY;

  toggle(slug: string): void {
    if (!SLUG.test(slug)) return;
    const current = this.getSnapshot();
    const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug].slice(-MAX_FAVORITES);
    this.snapshot = Object.freeze(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* almacenamiento lleno o bloqueado: se mantiene solo en memoria */
    }
    this.listeners.forEach((l) => l());
  }

  private read(): string[] {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      return Array.isArray(parsed)
        ? parsed.filter((s): s is string => typeof s === "string" && SLUG.test(s)).slice(0, MAX_FAVORITES)
        : [];
    } catch {
      return [];
    }
  }
}

const store = new FavoritesStore();

export function useFavorites() {
  const favorites = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  return {
    favorites,
    isFavorite: (slug: string) => favorites.includes(slug),
    toggle: (slug: string) => store.toggle(slug),
  };
}
