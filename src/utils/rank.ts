import type { GuguScoreSection } from "../api/types";

/** 从一分一段表条目中解析位次 */
export function parseRankFromSection(item: GuguScoreSection, targetScore: number): number | null {
  const scoreText = item.ExaminationScore ?? "";
  const ranking = Number.parseInt(item.Ranking, 10);

  if (scoreText.includes("-")) {
    const [minText, maxText] = scoreText.split("-");
    const min = Number.parseInt(minText, 10);
    const max = Number.parseInt(maxText, 10);
    if (Number.isFinite(min) && Number.isFinite(max) && targetScore >= min && targetScore <= max) {
      return Number.isFinite(ranking) ? ranking : parseRankRangeMid(item.RankingRange);
    }
    return null;
  }

  const exact = Number.parseInt(scoreText, 10);
  if (exact === targetScore) {
    return Number.isFinite(ranking) ? ranking : parseRankRangeMid(item.RankingRange);
  }

  return null;
}

/** 从 API 返回列表中找到最接近目标分数的位次 */
export function findBestRankMatch(
  sections: GuguScoreSection[],
  targetScore: number,
): { rank: number; rankRange: string } | null {
  let best: { rank: number; rankRange: string; diff: number } | null = null;

  for (const item of sections) {
    const parsed = parseRankFromSection(item, targetScore);
    if (parsed !== null) {
      return {
        rank: parsed,
        rankRange: item.RankingRange || String(parsed),
      };
    }

    const scoreText = item.ExaminationScore ?? "";
    const scoreValue = Number.parseInt(scoreText.split("-")[0], 10);
    if (!Number.isFinite(scoreValue)) {
      continue;
    }

    const diff = Math.abs(scoreValue - targetScore);
    const rank = Number.parseInt(item.Ranking, 10) || parseRankRangeMid(item.RankingRange);
    if (!Number.isFinite(rank)) {
      continue;
    }

    if (!best || diff < best.diff) {
      best = {
        rank,
        rankRange: item.RankingRange || String(rank),
        diff,
      };
    }
  }

  return best && best.diff <= 15 ? { rank: best.rank, rankRange: best.rankRange } : null;
}

function parseRankRangeMid(range: string): number {
  if (!range.includes("-")) {
    return Number.parseInt(range, 10) || 0;
  }
  const [start, end] = range.split("-").map((value) => Number.parseInt(value, 10));
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }
  return Math.round((start + end) / 2);
}
