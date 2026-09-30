import type { Clock } from "@/domain/repositories";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Reloj fijo para pruebas. */
export class FixedClock implements Clock {
  constructor(private instant: Date) {}

  now(): Date {
    return new Date(this.instant);
  }

  advance(ms: number): void {
    this.instant = new Date(this.instant.getTime() + ms);
  }
}
