/**
 * Clase base de las entidades: dos entidades son iguales si comparten identidad,
 * sin importar el resto de sus atributos.
 */
export abstract class Entity<TId extends { toString(): string }> {
  protected constructor(protected readonly _id: TId) {}

  get id(): TId {
    return this._id;
  }

  equals(other: Entity<TId>): boolean {
    return other.constructor === this.constructor && other._id.toString() === this._id.toString();
  }
}
