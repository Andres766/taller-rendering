import { Review, type ReviewProps } from "@/domain/entities/Review";
import type { ReviewRepository } from "@/domain/repositories";
import type { Slug } from "@/domain/value-objects/Slug";

export class InMemoryReviewRepository implements ReviewRepository {
  private readonly reviews: readonly Review[];

  constructor(seed: readonly ReviewProps[]) {
    this.reviews = seed.map((props) => Review.create(props));
  }

  async findByMovie(slug: Slug): Promise<Review[]> {
    return this.reviews.filter((r) => r.movieSlug.equals(slug));
  }
}
