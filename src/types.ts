export interface StudentProfile {
  name: string;
  province: string;
  score: number;
  rank: number;
  subjectType: "物理类" | "历史类" | "综合";
  batchFilter: BatchFilter;
  preferredProvinces: string[];
  preferredMajors: string[];
}

export type BatchLevel = "本科" | "专科";
export type BatchFilter = BatchLevel | "全部";

export interface University {
  id: string;
  schoolUuid?: string;
  name: string;
  province: string;
  city: string;
  level: "985" | "211" | "双一流" | "普通本科" | "专科";
  batchLevel?: BatchLevel;
  minScore: number;
  minRank: number;
  year: number;
  hotMajors: string[];
  dataSource?: "api" | "local";
  enrollProvince?: string;
  admissionBatch?: string;
  typeName?: string;
  /** 校园官网 */
  website?: string;
}

export type DataSourceMode = "api" | "local";

/** 高校招生计划（专业级） */
export interface EnrollmentPlan {
  id: string;
  schoolUuid: string;
  schoolName: string;
  majorName: string;
  shortMajorName: string;
  majorCode: string;
  recruitCode: string;
  enrollmentNumbers: number;
  tuition: number;
  batchName: string;
  subjectType: string;
  provinceName: string;
  year: number;
  courseSelectionRequirements: string;
  inSchoolYears: string;
  classOne: string;
  classTwo: string;
  specialGroupName: string;
  dataSource?: "api" | "local";
  /** 专业强度：王牌 / 专项 / 普通 */
  majorStrength?: MajorStrengthLevel;
  /** 2025 年最低录取分（参考） */
  prevYearMinScore?: number;
  /** 2025 年最低位次（参考） */
  prevYearMinRank?: number;
}

export type MajorStrengthLevel = "flagship" | "special" | "normal";

export interface VolunteerItem {
  order: number;
  universityId: string;
  major: string;
  risk: "冲" | "稳" | "保";
  recruitCode?: string;
  majorCode?: string;
  enrollmentNumbers?: number;
}

export interface MatchResult {
  university: University;
  scoreGap: number;
  rankGap: number;
  risk: "冲" | "稳" | "保";
  matchScore: number;
}

export interface GroupedMatches {
  冲: MatchResult[];
  稳: MatchResult[];
  保: MatchResult[];
}
