"use client";

import { useEffect, useMemo, useState } from "react";
import type { SearchResultDTO } from "@/application/dto";
import { ApiError, MovieApiClient, type SearchParams } from "../api/MovieApiClient";

type SearchState =
  | { status: "loading"; data: SearchResultDTO | null; error: null; fetchedAt: number | null }
  | { status: "success"; data: SearchResultDTO; error: null; fetchedAt: number }
  | { status: "error"; data: SearchResultDTO | null; error: string; fetchedAt: number | null };

const DEBOUNCE_MS = 300;

/**
 * Búsqueda en el cliente con debounce y cancelación: si el usuario sigue
 * escribiendo, la solicitud anterior se aborta (evita condiciones de carrera
 * donde una respuesta vieja pisa a una nueva).
 */
export function useMovieSearch(params: SearchParams) {
  const client = useMemo(() => new MovieApiClient(), []);
  const [state, setState] = useState<SearchState>({ status: "loading", data: null, error: null, fetchedAt: null });
  const { q, genre, sort } = params;

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setState((prev) => ({ status: "loading", data: prev.data, error: null, fetchedAt: prev.fetchedAt }));
      try {
        const data = await client.search({ q, genre, sort }, controller.signal);
        setState({ status: "success", data, error: null, fetchedAt: Date.now() });
      } catch (err) {
        if (controller.signal.aborted) return;
        const message = err instanceof ApiError ? err.message : "Error de red. Revisa tu conexión.";
        setState((prev) => ({ status: "error", data: prev.data, error: message, fetchedAt: prev.fetchedAt }));
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [client, q, genre, sort]);

  return state;
}
