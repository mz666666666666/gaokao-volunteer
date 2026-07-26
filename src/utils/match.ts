import type { GroupedMatches, MatchResult, StudentProfile, University } from "../types";
import { filterUniversitiesByBatch } from "./batch";

/** 每档最多展示院校数量 */
export const MAX_RESULTS_PER_RISK = 10;

/** 分数差 = 考生分数 - 院校最低分；正数表示高于院校线 */
const RISK_RULES = {
  冲: { minGap: -30, maxGap: -3 },
  稳: { minGap: -3, maxGap: 10 },
  保: { minGap: 10, maxGap: 45 },
} as const;

function getRiskByScoreGap(scoreGap: number): "冲" | "稳" | "保" | null {
  if (scoreGap >= RISK_RULES.保.minGap && scoreGap <= RISK_RULES.保.maxGap) {
    return "保";
  }
  if (scoreGap >= RISK_RULES.稳.minGap && scoreGap <= RISK_RULES.稳.maxGap) {
    return "稳";
  }
  if (scoreGap >= RISK_RULES.冲.minGap && scoreGap <= RISK_RULES.冲.maxGap) {
    return "冲";
  }
  return null;
}

function isValidRank(rank: number): boolean {
  return Number.isFinite(rank) && rank > 0 && rank < 900_000;
}

function isRankTrustworthy(score: number, rank: number): boolean {
  if (!isValidRank(rank)) {
    return false;
  }
  // 600 分以下位次通常不会进入全省前 8000
  if (score <= 600 && rank < 8000) {
    return false;
  }
  return true;
}

function isRelevantMatch(
  profile: StudentProfile,
  university: University,
  scoreGap: number,
  rankGap: number,
): boolean {
  if (university.minScore <= 0) {
    return false;
  }

  if (scoreGap < RISK_RULES.冲.minGap || scoreGap > RISK_RULES.保.maxGap) {
    return false;
  }

  if (
    isRankTrustworthy(profile.rank, profile.score) &&
    isValidRank(university.minRank) &&
    rankGap > 30_000 &&
    scoreGap < 0
  ) {
    return false;
  }

  return true;
}

function calcMatchScore(
  profile: StudentProfile,
  university: University,
  scoreGap: number,
  risk: "冲" | "稳" | "保",
): number {
  let matchScore = 0;

  if (profile.preferredProvinces.includes(university.province)) {
    matchScore += 35;
  }

  if (
    profile.preferredMajors.some((major) =>
      university.hotMajors.some(
        (hot) => hot.includes(major) || major.includes(hot),
      ),
    )
  ) {
    matchScore += 40;
  }

  if (risk === "稳") {
    matchScore += 30;
  } else if (risk === "保") {
    matchScore += 18;
  } else {
    matchScore += 10;
  }

  matchScore += Math.max(0, 15 - Math.abs(scoreGap));

  if (university.level === "985") {
    matchScore += 5;
  } else if (university.level === "211" || university.level === "双一流") {
    matchScore += 3;
  }

  return matchScore;
}

export function matchUniversities(
  profile: StudentProfile,
  list: University[],
): MatchResult[] {
  const filteredList = filterUniversitiesByBatch(list, profile.batchFilter);
  const results: MatchResult[] = [];
  for (const university of filteredList) {
    const scoreGap = profile.score - university.minScore;
    const rankGap = isValidRank(university.minRank)
      ? profile.rank - university.minRank
      : 0;
    const risk = getRiskByScoreGap(scoreGap);

    if (!risk || !isRelevantMatch(profile, university, scoreGap, rankGap)) {
      continue;
    }

    results.push({
      university,
      scoreGap,
      rankGap,
      risk,
      matchScore: calcMatchScore(profile, university, scoreGap, risk),
    });
  }

  return results.sort((a, b) => b.matchScore - a.matchScore);
}

export function groupMatchesByRisk(matches: MatchResult[]): GroupedMatches {
  const grouped: GroupedMatches = { 冲: [], 稳: [], 保: [] };

  for (const risk of ["冲", "稳", "保"] as const) {
    grouped[risk] = matches
      .filter((item) => item.risk === risk)
      .slice(0, MAX_RESULTS_PER_RISK);
  }

  return grouped;
}

export function getRiskDescription(risk: "冲" | "稳" | "保"): string {
  const rule = RISK_RULES[risk];
  return `分数差 ${rule.minGap} ~ ${rule.maxGap} 分`;
}
