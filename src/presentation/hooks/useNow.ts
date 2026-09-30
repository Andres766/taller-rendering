"use client";

import { useSyncExternalStore } from "react";

/**
 * Patrón Observer: un único temporizador compartido notifica a todos los
 * componentes suscritos. El intervalo solo existe mientras haya suscriptores.
 */
class TickerStore {
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private current = Date.now();

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    if (!this.timer) {
      this.current = Date.now();
      this.timer = setInterval(() => {
        this.current = Date.now();
        this.listeners.forEach((l) => l());
      }, 1000);
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0 && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    };
  };

  getSnapshot = (): number => this.current;
}

const ticker = new TickerStore();

/** Hora actual del navegador; devuelve null durante el render en servidor (evita errores de hidratación). */
export function useNow(): number | null {
  return useSyncExternalStore(ticker.subscribe, ticker.getSnapshot, () => null);
}
