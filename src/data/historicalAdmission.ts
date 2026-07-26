import { PREVIOUS_GAOKAO_YEAR } from "../constants/gaokao";

interface HistoricalRecord {
  minScore: number;
  minRank: number;
}

/** 2025 年各专业录取参考（本地演示数据） */
const historicalRecords: Record<string, HistoricalRecord> = {
  "桂林理工大学::地质工程": { minScore: 526, minRank: 75500 },
  "桂林理工大学::土木工程": { minScore: 524, minRank: 76800 },
  "桂林理工大学::计算机科学与技术": { minScore: 538, minRank: 69000 },
  "桂林理工大学::测绘工程": { minScore: 522, minRank: 78200 },
  "桂林理工大学::资源勘查工程": { minScore: 518, minRank: 81000 },
  "山东大学::计算机科学与技术": { minScore: 608, minRank: 12800 },
  "山东大学::软件工程": { minScore: 605, minRank: 13500 },
  "青岛大学::计算机科学与技术": { minScore: 542, minRank: 62000 },
  "湖北大学::计算机科学与技术": { minScore: 548, minRank: 58500 },
  "三峡大学::电气工程及其自动化": { minScore: 518, minRank: 82000 },
  "三峡大学::土木工程": { minScore: 512, minRank: 86000 },
  "烟台大学::计算机科学与技术": { minScore: 528, minRank: 71000 },
  "临沂大学::计算机科学与技术": { minScore: 526, minRank: 72500 },
  "武汉理工大学::计算机科学与技术": { minScore: 562, minRank: 47000 },
  "中南民族大学::计算机科学与技术": { minScore: 538, minRank: 65500 },
  "暨南大学::计算机科学与技术": { minScore: 592, minRank: 21000 },
  "华南理工大学::计算机科学与技术": { minScore: 618, minRank: 9800 },
  "南京大学::计算机科学与技术": { minScore: 648, minRank: 3800 },
};

function buildKey(schoolName: string, majorName: string): string {
  return `${schoolName}::${majorName}`;
}

export function lookupHistoricalAdmission(
  schoolName: string,
  majorName: string,
  currentMinScore?: number,
): HistoricalRecord | undefined {
  const exact = historicalRecords[buildKey(schoolName, majorName)];
  if (exact) {
    return exact;
  }

  if (currentMinScore && currentMinScore > 0) {
    return {
      minScore: Math.max(400, currentMinScore - 8),
      minRank: Math.round(currentMinScore * 120),
    };
  }

  return undefined;
}

export function getPreviousYearLabel(): number {
  return PREVIOUS_GAOKAO_YEAR;
}
