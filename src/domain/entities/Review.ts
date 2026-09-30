import { ValidationError } from "../errors";
import { Rating } from "../value-objects/Rating";
import { Slug } from "../value-objects/Slug";
import { Entity } from "./Entity";

export interface ReviewProps {
  id: string;
  movieSlug: string;
  author: string;
  /** null si el autor no calificó (común en reseñas externas). */
  rating: number | null;
  comment: string;
  createdAt: string; // ISO
}

/** Reseña de un espectador. */
export class Review extends Entity<string> {
  static readonly MAX_COMMENT_LENGTH = 500;

  private constructor(
    id: string,
    private readonly _movieSlug: Slug,
    private readonly _author: string,
    private readonly _rating: Rating | null,
    private readonly _comment: string,
    private readonly _createdAt: Date,
  ) {
    super(id);
  }

  static create(props: ReviewProps): Review {
    const author = props.author.trim();
    const comment = props.comment.trim();
    if (author.length === 0 || author.length > 60) {
      throw new ValidationError("El autor debe tener entre 1 y 60 caracteres");
    }
    if (comment.length === 0 || comment.length > Review.MAX_COMMENT_LENGTH) {
      throw new ValidationError(`El comentario debe tener entre 1 y ${Review.MAX_COMMENT_LENGTH} caracteres`);
    }
    return new Review(
      props.id,
      Slug.create(props.movieSlug),
      author,
      props.rating === null ? null : Rating.of(props.rating),
      comment,
      new Date(props.createdAt),
    );
  }

  get movieSlug(): Slug {
    return this._movieSlug;
  }
  get author(): string {
    return this._author;
  }
  get rating(): Rating | null {
    return this._rating;
  }
  get comment(): string {
    return this._comment;
  }
  get createdAt(): Date {
    return new Date(this._createdAt);
  }
}
