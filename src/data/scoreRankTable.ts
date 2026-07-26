/** 各省分数→位次估算表（离线备用，API 不可用时使用） */
export interface ScoreRankPoint {
  score: number;
  rank: number;
}

type ScoreRankTable = Record<string, Record<string, ScoreRankPoint[]>>;

const tables: ScoreRankTable = {
  山东: {
    物理类: [
      { score: 680, rank: 500 },
      { score: 650, rank: 3500 },
      { score: 620, rank: 12000 },
      { score: 600, rank: 22000 },
      { score: 580, rank: 38000 },
      { score: 560, rank: 55000 },
      { score: 538, rank: 71699 },
      { score: 520, rank: 90000 },
      { score: 500, rank: 110000 },
      { score: 480, rank: 135000 },
    ],
    历史类: [
      { score: 660, rank: 800 },
      { score: 620, rank: 5000 },
      { score: 580, rank: 18000 },
      { score: 550, rank: 35000 },
      { score: 530, rank: 52000 },
      { score: 500, rank: 78000 },
    ],
    综合: [
      { score: 650, rank: 3000 },
      { score: 600, rank: 20000 },
      { score: 550, rank: 45000 },
      { score: 500, rank: 90000 },
    ],
  },
  江苏: {
    物理类: [
      { score: 650, rank: 3500 },
      { score: 600, rank: 15000 },
      { score: 550, rank: 40000 },
      { score: 520, rank: 62000 },
    ],
    历史类: [
      { score: 620, rank: 5500 },
      { score: 570, rank: 20000 },
      { score: 530, rank: 45000 },
    ],
    综合: [{ score: 550, rank: 38000 }],
  },
  湖北: {
    物理类: [
      { score: 650, rank: 3800 },
      { score: 620, rank: 14000 },
      { score: 600, rank: 24000 },
      { score: 580, rank: 36000 },
      { score: 560, rank: 50000 },
      { score: 538, rank: 69000 },
      { score: 520, rank: 86000 },
      { score: 500, rank: 108000 },
    ],
    历史类: [
      { score: 620, rank: 5200 },
      { score: 580, rank: 17000 },
      { score: 550, rank: 34000 },
      { score: 520, rank: 55000 },
    ],
    综合: [
      { score: 600, rank: 22000 },
      { score: 550, rank: 44000 },
      { score: 500, rank: 92000 },
    ],
  },
};

function resolveSubjectKey(
  province: string,
  subjectType: "物理类" | "历史类" | "综合",
): ScoreRankPoint[] {
  const provinceTable = tables[province] ?? tables.山东;
  return provinceTable[subjectType] ?? provinceTable.物理类 ?? tables.山东.物理类;
}

/** 根据分数线性插值估算位次 */
export function estimateRankByScore(
  score: number,
  province: string,
  subjectType: "物理类" | "历史类" | "综合",
): { rank: number; rankRange: string } {
  const points = resolveSubjectKey(province, subjectType).slice().sort((a, b) => b.score - a.score);

  if (score >= points[0].score) {
    return { rank: points[0].rank, rankRange: `1-${points[0].rank}` };
  }

  const last = points[points.length - 1];
  if (score <= last.score) {
    const extraRank = Math.round((last.score - score) * 2500);
    const rank = last.rank + extraRank;
    return { rank, rankRange: `${rank - 500}-${rank + 500}` };
  }

  for (let i = 0; i < points.length - 1; i += 1) {
    const high = points[i];
    const low = points[i + 1];
    if (score <= high.score && score >= low.score) {
      const ratio = (high.score - score) / (high.score - low.score);
      const rank = Math.round(high.rank + ratio * (low.rank - high.rank));
      return { rank, rankRange: `${Math.max(1, rank - 800)}-${rank + 800}` };
    }
  }

  return { rank: 100000, rankRange: "估算值" };
}
