import { ValidationError } from "../errors";
import { Slug } from "../value-objects/Slug";
import { Entity } from "./Entity";

export type ShowtimeStatus = "disponible" | "ultimas-sillas" | "agotada" | "finalizada";

export interface ShowtimeProps {
  id: string;
  movieSlug: string;
  cinema: string;
  city: string;
  room: string;
  startsAt: Date;
  format: "2D" | "3D" | "IMAX";
  totalSeats: number;
  reservedSeats: number;
}

/** Una función (proyección) de una película en una sala concreta. */
export class Showtime extends Entity<string> {
  private static readonly LOW_AVAILABILITY_RATIO = 0.15;

  private constructor(
    id: string,
    private readonly _movieSlug: Slug,
    private readonly _cinema: string,
    private readonly _city: string,
    private readonly _room: string,
    private readonly _startsAt: Date,
    private readonly _format: ShowtimeProps["format"],
    private readonly _totalSeats: number,
    private readonly _reservedSeats: number,
  ) {
    super(id);
  }

  static create(props: ShowtimeProps): Showtime {
    if (!Number.isInteger(props.totalSeats) || props.totalSeats <= 0) {
      throw new ValidationError("La sala debe tener al menos una silla");
    }
    if (
      !Number.isInteger(props.reservedSeats) ||
      props.reservedSeats < 0 ||
      props.reservedSeats > props.totalSeats
    ) {
      throw new ValidationError("Las sillas reservadas exceden la capacidad de la sala");
    }
    return new Showtime(
      props.id,
      Slug.create(props.movieSlug),
      props.cinema,
      props.city,
      props.room,
      new Date(props.startsAt),
      props.format,
      props.totalSeats,
      props.reservedSeats,
    );
  }

  get movieSlug(): Slug {
    return this._movieSlug;
  }
  get cinema(): string {
    return this._cinema;
  }
  get city(): string {
    return this._city;
  }
  get room(): string {
    return this._room;
  }
  get startsAt(): Date {
    return new Date(this._startsAt);
  }
  get format(): ShowtimeProps["format"] {
    return this._format;
  }
  get totalSeats(): number {
    return this._totalSeats;
  }

  get availableSeats(): number {
    return this._totalSeats - this._reservedSeats;
  }

  get occupancy(): number {
    return this._reservedSeats / this._totalSeats;
  }

  statusAt(now: Date): ShowtimeStatus {
    if (this._startsAt.getTime() <= now.getTime()) return "finalizada";
    if (this.availableSeats === 0) return "agotada";
    if (this.availableSeats / this._totalSeats <= Showtime.LOW_AVAILABILITY_RATIO) {
      return "ultimas-sillas";
    }
    return "disponible";
  }
}
