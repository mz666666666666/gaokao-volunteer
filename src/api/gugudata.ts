import { guguConfig } from "./config";
import type {
  GuguCollege,
  GuguCollegeLine,
  GuguEnrollmentPlan,
  GuguResponse,
  GuguScoreSection,
} from "./types";
import {
  enrichUniversityWithPlans,
  mapEnrollmentPlan,
  mergeCollegeData,
  matchSubjectType,
} from "./transform";
import type { EnrollmentPlan, University } from "../types";
import { attachSchoolWebsites } from "../data/schoolWebsites";
import { estimateRankByScore } from "../data/scoreRankTable";
import { universities as localUniversities } from "../data/universities";
import { findBestRankMatch } from "../utils/rank";

class GuguApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "GuguApiError";
  }
}

function buildUrl(path: string, params: Record<string, string | number | boolean>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== "" && value !== undefined) {
      search.set(key, String(value));
    }
  }
  if (!guguConfig.useDemo && guguConfig.appKey) {
    search.set("appkey", guguConfig.appKey);
  }
  const suffix = search.toString();
  return `${guguConfig.baseUrl}${path}${suffix ? `?${suffix}` : ""}`;
}

async function request<T>(url: string): Promise<T[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new GuguApiError(`HTTP ${response.status}`, response.status);
  }
  const json = (await response.json()) as GuguResponse<T>;
  if (json.DataStatus.StatusCode !== 100) {
    throw new GuguApiError(
      json.DataStatus.StatusDescription || "接口返回异常",
      json.DataStatus.StatusCode,
    );
  }
  const data = json.Data;
  if (Array.isArray(data)) {
    return data;
  }
  if (data == null) {
    return [];
  }
  return [data];
}

/** 按省份查询高校录取分数线（全国高校在该省的招生数据） */
export async function fetchCollegeScoreLines(options: {
  enrollProvince: string;
  year: number;
  pageIndex?: number;
  pageSize?: number;
  maxScore?: number;
}): Promise<GuguCollegeLine[]> {
  const { enrollProvince, year, pageIndex = 1, pageSize = 20, maxScore } = options;
  const path = guguConfig.useDemo
    ? "/metadata/ceecollegeline/demo"
    : "/metadata/ceecollegeline";

  return request<GuguCollegeLine>(
    buildUrl(path, {
      searchtype: "PROVINCENAME",
      keyword: enrollProvince,
      pageindex: pageIndex,
      pagesize: Math.min(pageSize, 20),
      year,
      keywordstrict: false,
      ...(maxScore ? { min: maxScore } : {}),
    }),
  );
}

/** 搜索全国高校基础信息 */
export async function fetchColleges(options: {
  keywords?: string;
  pageIndex?: number;
  pageSize?: number;
  is985?: boolean;
  is211?: boolean;
}): Promise<GuguCollege[]> {
  const path = guguConfig.useDemo ? "/location/college/demo" : "/location/college";
  return request<GuguCollege>(
    buildUrl(path, {
      keywords: options.keywords ?? "",
      pageindex: options.pageIndex ?? 1,
      pagesize: Math.min(options.pageSize ?? 20, 20),
      keywordstrict: false,
      sort: "ranking|asc",
      ...(options.is985 ? { is985: true } : {}),
      ...(options.is211 ? { is211: true } : {}),
    }),
  );
}

/** 查询高校招生计划（按招生省份 / 学校筛选） */
export async function fetchEnrollmentPlans(options: {
  provinceName: string;
  year: number;
  schoolName?: string;
  schoolUuid?: string;
  majorKeyword?: string;
  pageIndex?: number;
  pageSize?: number;
}): Promise<EnrollmentPlan[]> {
  const path = guguConfig.useDemo
    ? "/metadata/college-enrollment-plan/demo"
    : "/metadata/college-enrollment-plan";

  const rows = await request<GuguEnrollmentPlan>(
    buildUrl(path, {
      provincename: options.provinceName,
      year: options.year,
      schoolname: options.schoolName ?? "",
      schooluuid: options.schoolUuid ?? "",
      collegemajorname: options.majorKeyword ?? "",
      pageIndex: options.pageIndex ?? 1,
      pageSize: Math.min(options.pageSize ?? 20, 100),
    }),
  );

  return rows.map(mapEnrollmentPlan);
}

/** 根据分数查询全省位次（一分一段表） */
export async function fetchRankByScore(options: {
  provinceName: string;
  subjectType: string;
  score: number;
  year?: number;
}): Promise<{ rank: number; rankRange: string; source: "api" | "local" }> {
  const local = estimateRankByScore(
    options.score,
    options.provinceName,
    options.subjectType as "物理类" | "历史类" | "综合",
  );

  // Demo 接口忽略参数，返回固定高分段数据，直接使用本地估算
  if (guguConfig.useDemo) {
    return { ...local, source: "local" };
  }

  const year = options.year ?? guguConfig.defaultYear;
  const path = "/metadata/ceeline/one-score-one-section";

  try {
    const sections = await request<GuguScoreSection>(
      buildUrl(path, {
        year,
        provinceName: options.provinceName,
        subjectSelection: options.subjectType,
        score: options.score,
        pageIndex: 1,
        pageSize: 100,
        isArtLine: false,
      }),
    );

    const matched = findBestRankMatch(sections, options.score);
    if (matched) {
      return { ...matched, source: "api" };
    }
  } catch {
    // 回退本地估算
  }

  return { ...local, source: "local" };
}

/** 批量同步多个招生省份的招生计划 */
export async function loadEnrollmentPlansForProvinces(
  provinceNames: string[],
  options?: {
    year?: number;
    majorKeyword?: string;
    maxPages?: number;
  },
): Promise<EnrollmentPlan[]> {
  const uniqueProvinces = [...new Set(provinceNames.filter(Boolean))];
  const batches = await Promise.all(
    uniqueProvinces.map((provinceName) =>
      loadEnrollmentPlansByProvince({
        provinceName,
        year: options?.year,
        majorKeyword: options?.majorKeyword,
        maxPages: options?.maxPages ?? 2,
      }).catch(() => []),
    ),
  );

  const merged = batches.flat();
  const seen = new Set<string>();
  return merged.filter((plan) => {
    if (seen.has(plan.id)) {
      return false;
    }
    seen.add(plan.id);
    return true;
  });
}

function parseScoreValue(value: string): number {
  return Number.parseInt(value, 10) || 0;
}

function pickBestScoreLine(lines: GuguCollegeLine[]): GuguCollegeLine {
  const regularLines = lines.filter(
    (line) => !line.AdmissionBatch || /本科批|本科一批|普通类/.test(line.AdmissionBatch),
  );
  const pool = regularLines.length > 0 ? regularLines : lines;
  return pool.reduce((best, current) => {
    const bestScore = parseScoreValue(best.LowestScore);
    const currentScore = parseScoreValue(current.LowestScore);
    if (bestScore === 0) {
      return current;
    }
    if (currentScore === 0) {
      return best;
    }
    return currentScore < bestScore ? current : best;
  });
}

/** 合并 API 院校与本地备用库，确保推荐不为空 */
function mergeUniversityPools(apiList: University[]): University[] {
  const map = new Map<string, University>();
  for (const item of apiList) {
    map.set(item.id, item);
  }
  for (const item of localUniversities) {
    if (!map.has(item.id)) {
      map.set(item.id, { ...item, dataSource: "local" });
    }
  }
  return attachSchoolWebsites(Array.from(map.values()));
}

/** 拉取某校在指定省份的全部招生计划（自动翻页） */
export async function loadEnrollmentPlansForSchool(options: {
  provinceName: string;
  year?: number;
  schoolName?: string;
  schoolUuid?: string;
  maxPages?: number;
}): Promise<EnrollmentPlan[]> {
  const year = options.year ?? guguConfig.defaultYear;
  const maxPages = options.maxPages ?? 5;
  const allPlans: EnrollmentPlan[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const plans = await fetchEnrollmentPlans({
      provinceName: options.provinceName,
      year,
      schoolName: options.schoolName,
      schoolUuid: options.schoolUuid,
      pageIndex: page,
      pageSize: 100,
    });
    if (plans.length === 0) {
      break;
    }
    allPlans.push(...plans);
  }

  return allPlans;
}

/** 拉取某招生省份的招生计划（自动翻页） */
export async function loadEnrollmentPlansByProvince(options: {
  provinceName: string;
  year?: number;
  majorKeyword?: string;
  maxPages?: number;
}): Promise<EnrollmentPlan[]> {
  const year = options.year ?? guguConfig.defaultYear;
  const maxPages = options.maxPages ?? 3;
  const allPlans: EnrollmentPlan[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const plans = await fetchEnrollmentPlans({
      provinceName: options.provinceName,
      year,
      majorKeyword: options.majorKeyword,
      pageIndex: page,
      pageSize: 100,
    });
    if (plans.length === 0) {
      break;
    }
    allPlans.push(...plans);
  }

  return allPlans;
}

/** 加载指定省份可用于志愿匹配的院校列表 */
export async function loadUniversitiesFromApi(options: {
  enrollProvince: string;
  subjectType: "物理类" | "历史类" | "综合";
  userScore?: number;
  year?: number;
  maxPages?: number;
}): Promise<University[]> {
  const year = options.year ?? guguConfig.defaultYear;

  // Demo 接口固定返回北大等顶尖院校，与中等分数无法匹配，直接用本地库
  if (guguConfig.useDemo) {
    return localUniversities.map((item) => ({ ...item, dataSource: "local" as const }));
  }

  const maxPages = options.maxPages ?? 5;
  const allLines: GuguCollegeLine[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const lines = await fetchCollegeScoreLines({
      enrollProvince: options.enrollProvince,
      year,
      pageIndex: page,
      pageSize: 20,
      maxScore: options.userScore ? Math.max(0, options.userScore - 35) : undefined,
    });
    if (lines.length === 0) {
      break;
    }
    allLines.push(...lines);
  }

  const filtered = allLines.filter((line) =>
    matchSubjectType(line.TypeName, options.subjectType),
  );

  const collegeDetails = await fetchColleges({ pageSize: 20 }).catch(() => []);
  const detailMap = new Map(
    collegeDetails.map((item) => [item.SchoolUUID, item]),
  );

  const linesBySchool = filtered.reduce<Map<string, GuguCollegeLine[]>>((map, line) => {
    const key = line.SchoolUUID || line.CollegeName;
    const list = map.get(key) ?? [];
    list.push(line);
    map.set(key, list);
    return map;
  }, new Map());

  const universities: University[] = [];

  for (const [, lines] of linesBySchool) {
    const bestLine = pickBestScoreLine(lines);
    universities.push(mergeCollegeData(bestLine, detailMap.get(bestLine.SchoolUUID)));
  }

  const planProvinces = [options.enrollProvince];
  const enrollmentPlans = await loadEnrollmentPlansForProvinces(planProvinces, {
    year,
    maxPages: 2,
  }).catch(() => []);
  const plansBySchool = enrollmentPlans.reduce<Map<string, EnrollmentPlan[]>>(
    (map, plan) => {
      const schoolKey = plan.schoolUuid || plan.schoolName;
      const list = map.get(schoolKey) ?? [];
      list.push(plan);
      map.set(schoolKey, list);
      return map;
    },
    new Map(),
  );

  return mergeUniversityPools(
    universities
      .map((university) =>
        enrichUniversityWithPlans(
          university,
          plansBySchool.get(university.schoolUuid ?? university.id) ??
            plansBySchool.get(university.name) ??
            [],
        ),
      )
      .sort((a, b) => b.minScore - a.minScore),
  );
}

export function getApiModeLabel(): string {
  return guguConfig.useDemo
    ? "演示模式（本地院校库 + 位次估算）"
    : "正式 API（咕咕数据）";
}

export function isDemoApiMode(): boolean {
  return guguConfig.useDemo;
}

/** 按校名关键词搜索院校（全国索引 + API） */
export async function searchCollegesByKeyword(options: {
  keyword: string;
  enrollProvince: string;
  subjectType: "物理类" | "历史类" | "综合";
  source: "api" | "local";
  year?: number;
}): Promise<University[]> {
  const keyword = options.keyword.trim();
  if (!keyword) {
    return [];
  }

  if (options.source === "local") {
    return [];
  }

  const year = options.year ?? guguConfig.defaultYear;

  // Demo 模式：尝试调用演示接口并按关键词过滤
  const colleges = await fetchColleges({ keywords: keyword, pageSize: 20 }).catch(() => []);
  const filteredColleges = colleges.filter(
    (college) =>
      college.CollegeName.includes(keyword) ||
      keyword.includes(college.CollegeName.replace(/大学|学院|职业|技术|专科/g, "")),
  );

  if (guguConfig.useDemo) {
    if (filteredColleges.length === 0) {
      return [];
    }
    return attachSchoolWebsites(
      filteredColleges.map((college) => ({
        id: college.SchoolUUID || college.CollegeName,
        schoolUuid: college.SchoolUUID,
        name: college.CollegeName,
        province: college.Province,
        city: college.City?.replace(/市$/, "") ?? "",
        level: college.Is985 ? "985" : college.Is211 ? "211" : college.IsDualClass ? "双一流" : "普通本科",
        minScore: 0,
        minRank: 999999,
        year,
        hotMajors: college.MajorList?.flatMap((group) => group.Majors).slice(0, 5) ?? ["计算机科学与技术"],
        dataSource: "api" as const,
        website: college.WebSite?.trim() || undefined,
      })),
    );
  }

  if (filteredColleges.length === 0) {
    return [];
  }

  const lines = await fetchCollegeScoreLines({
    enrollProvince: options.enrollProvince,
    year,
    pageIndex: 1,
    pageSize: 20,
  }).catch(() => []);

  const lineMap = new Map<string, GuguCollegeLine[]>();
  for (const line of lines) {
    if (!matchSubjectType(line.TypeName, options.subjectType)) {
      continue;
    }
    const key = line.SchoolUUID || line.CollegeName;
    const list = lineMap.get(key) ?? [];
    list.push(line);
    lineMap.set(key, list);
  }

  return attachSchoolWebsites(
    filteredColleges.map((college) => {
      const schoolLines = lineMap.get(college.SchoolUUID) ?? [];
      if (schoolLines.length > 0) {
        return mergeCollegeData(pickBestScoreLine(schoolLines), college);
      }
      return {
        id: college.SchoolUUID || college.CollegeName,
        schoolUuid: college.SchoolUUID,
        name: college.CollegeName,
        province: college.Province,
        city: college.City?.replace(/市$/, "") ?? "",
        level: college.Is985 ? "985" : college.Is211 ? "211" : college.IsDualClass ? "双一流" : "普通本科",
        minScore: 0,
        minRank: 999999,
        year,
        hotMajors: college.MajorList?.flatMap((group) => group.Majors).slice(0, 5) ?? ["计算机科学与技术"],
        dataSource: "api" as const,
        website: college.WebSite?.trim() || undefined,
      };
    }),
  );
}

export { GuguApiError };
