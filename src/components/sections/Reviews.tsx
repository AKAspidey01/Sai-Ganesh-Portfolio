import { headings, reviews } from '../../data/portfolio';
import { SectionPill } from '../ui/SectionPill';
import { SectionHeading } from '../ui/SectionHeading';
import { HorizontalPinnedGallery } from '../ui/HorizontalPinnedGallery';
import { ReviewCard } from '../ui/ReviewCard';

export function Reviews() {
  return (
    <section id="reviews" className="section section--dark section--pinned" aria-labelledby="reviews-title">
      <div className="container">
        <SectionPill label={headings.reviews.pill} tone="dark" />
        <SectionHeading id="reviews-title" parts={headings.reviews.parts} tone="dark" />
      </div>
      <HorizontalPinnedGallery
        items={reviews}
        getKey={(r) => r.id}
        label="Client reviews"
        className="hpg--reviews"
        renderItem={(r) => <ReviewCard review={r} />}
      />
    </section>
  );
}
