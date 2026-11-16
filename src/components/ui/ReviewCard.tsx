import type { Review } from '../../data/portfolio';
import { StarIcon } from './Icons';

export function ReviewCard({ review }: { review: Review }) {
  const initials = review.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <figure className="review-card">
      <figcaption className="review-card__who">
        {review.avatar ? (
          <img className="review-card__avatar" src={review.avatar} alt="" width={56} height={56} loading="lazy" />
        ) : (
          <span className="review-card__avatar review-card__avatar--initials" aria-hidden="true">
            {initials}
          </span>
        )}
        <span>
          <span className="review-card__name">{review.name}</span>
          <span className="review-card__loc">{review.location}</span>
        </span>
      </figcaption>
      <p className="review-card__stars" aria-label={`Rated ${review.rating} out of 5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon key={i} className={i < review.rating ? 'is-on' : ''} />
        ))}
      </p>
      <blockquote className="review-card__quote">
        <p>{review.quote}</p>
      </blockquote>
    </figure>
  );
}
