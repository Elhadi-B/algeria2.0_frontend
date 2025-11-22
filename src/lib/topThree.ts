import type { RankingItem } from "./types";

export type TopThreeResult = {
  first: RankingItem[];
  second: RankingItem[];
  third: RankingItem[];
};

const SCORE_EPSILON = 0.0001;

const parseScore = (value: string | number | undefined): number => {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const computeTopThree = (rankings: RankingItem[]): TopThreeResult => {
  if (!rankings?.length) {
    return { first: [], second: [], third: [] };
  }

  const sortedByScore = [...rankings].sort((a, b) => parseScore(b.average_score) - parseScore(a.average_score));

  const buckets: Record<number, RankingItem[]> = {
    1: [],
    2: [],
    3: [],
  };

  let currentRank = 0;
  let lastScore: number | null = null;

  for (const team of sortedByScore) {
    const score = parseScore(team.average_score);
    if (!Number.isFinite(score)) {
      continue;
    }

    if (lastScore === null || Math.abs(score - lastScore) > SCORE_EPSILON) {
      currentRank += 1;
      lastScore = score;
    }

    if (currentRank > 3) {
      break;
    }

    const bucket = buckets[currentRank];
    if (bucket) {
      bucket.push(team);
    }
  }

  return {
    first: buckets[1],
    second: buckets[2],
    third: buckets[3],
  };
};
