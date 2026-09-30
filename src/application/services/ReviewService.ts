import type { ReviewRepository } from "@/domain/repositories";
import { Rating } from "@/domain/value-objects/Rating";
import { Slug } from "@/domain/value-objects/Slug";
import type { ReviewSummaryDTO } from "../dto";
import { ReviewMapper } from "../mappers";

export class ReviewService {
  constructor(private readonly reviews: ReviewRepository) {}

  async getSummary(rawSlug: string): Promise<ReviewSummaryDTO> {
    const list = await this.reviews.findByMovie(Slug.create(rawSlug));
    const sorted = [...list].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      average: Rating.average(list.flatMap((r) => (r.rating ? [r.rating] : [])))?.value ?? null,
      count: list.length,
      reviews: sorted.map(ReviewMapper.toDTO),
    };
  }
}
