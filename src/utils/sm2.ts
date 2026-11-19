import { Flashcard, FlashcardRating } from '../types/studyflow';

export interface SM2Result {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: string;
}

/**
 * Computes the next SM-2 spaced repetition state for a flashcard.
 */
export function calculateSM2(card: Flashcard, rating: FlashcardRating, now = new Date()): SM2Result {
  let { easeFactor, intervalDays, repetitions } = card;

  const qualityMap: Record<FlashcardRating, number> = {
    again: 1,
    hard: 3,
    good: 4,
    easy: 5,
  };

  const q = qualityMap[rating];

  if (rating === 'again') {
    repetitions = 0;
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else {
    if (repetitions === 0) {
      intervalDays = rating === 'hard' ? 1 : rating === 'good' ? 3 : 6;
    } else if (repetitions === 1) {
      intervalDays = rating === 'hard' ? 3 : rating === 'good' ? 7 : 12;
    } else {
      const multiplier = rating === 'hard' ? 1.2 : rating === 'easy' ? easeFactor * 1.3 : easeFactor;
      intervalDays = Math.max(1, Math.round(intervalDays * multiplier));
    }

    repetitions += 1;
    easeFactor = Math.max(1.3, Number((easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(2)));
  }

  const next = new Date(now);
  next.setDate(next.getDate() + intervalDays);

  return {
    easeFactor,
    intervalDays,
    repetitions,
    nextReviewAt: next.toISOString(),
  };
}

export function previewIntervals(card: Flashcard): Record<FlashcardRating, string> {
  const ratings: FlashcardRating[] = ['again', 'hard', 'good', 'easy'];
  const out = {} as Record<FlashcardRating, string>;
  for (const r of ratings) {
    const res = calculateSM2(card, r);
    out[r] = formatIntervalDays(res.intervalDays);
  }
  return out;
}

export function formatIntervalDays(days: number): string {
  if (days <= 1) return '1d';
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}

export function isCardDue(card: Flashcard, now = new Date()): boolean {
  return new Date(card.nextReviewAt).getTime() <= now.getTime();
}
