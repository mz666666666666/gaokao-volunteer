import type { GuguCollege, GuguCollegeLine, GuguEnrollmentPlan } from "./types";
import type { EnrollmentPlan, University } from "../types";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";

function inferProvinceFromCity(city: string): string {
  const normalized = city.replace(/市$/, "");
  const direct: Record<string, string> = {
    北京: "北京",
    上海: "上海",
    天津: "天津",
    重庆: "重庆",
  };
  if (direct[normalized]) {
    return direct[normalized];
  }
  if (city.includes("北京")) return "北京";
  if (city.includes("上海")) return "上海";
  if (city.includes("天津")) return "天津";
  if (city.includes("重庆")) return "重庆";
  return normalized;
}

function resolveLevel(
  is985: boolean,
  is211: boolean,
  isDualClass: boolean,
): University["level"] {
  if (is985) {
    return "985";
  }
  if (is211) {
    return "211";
  }
  if (isDualClass) {
    return "双一流";
  }
  return "普通本科";
}

function extractMajors(college?: GuguCollege, limit = 5): string[] {
  if (!college?.MajorList?.length) {
    return ["计算机科学与技术", "软件工程", "会计学"];
  }
  const majors = college.MajorList.flatMap((group) => group.Majors);
  return [...new Set(majors)].slice(0, limit);
}

function parseRank(value: string): number {
  const rank = Number.parseInt(value, 10);
  return Number.isFinite(rank) ? rank : 999_999;
}

function parseScore(value: string): number {
  const score = Number.parseInt(value, 10);
  return Number.isFinite(score) ? score : 0;
}

/** 将 API 分数线与高校详情合并为本地 University 结构 */
export function mergeCollegeData(
  line: GuguCollegeLine,
  detail?: GuguCollege,
): University {
  const city = detail?.City?.replace(/市$/, "") ?? line.SchoolInCity?.replace(/市$/, "") ?? "";
  return {
    id: line.SchoolUUID || line.CollegeName,
    schoolUuid: line.SchoolUUID,
    name: line.CollegeName,
    province:
      detail?.Province ??
      line.CollegeProvinceName ??
      inferProvinceFromCity(line.SchoolInCity),
    enrollProvince: line.Province,
    city,
    level: resolveLevel(line.Is985, line.Is211, line.IsDualClass),
    minScore: parseScore(line.LowestScore),
    minRank: parseRank(line.LowestRank),
    year: line.Year || GAOKAO_DATA_YEAR,
    hotMajors: extractMajors(detail),
    dataSource: "api",
    admissionBatch: line.AdmissionBatch,
    typeName: line.TypeName,
    batchLevel: line.AdmissionBatch && /专科/.test(line.AdmissionBatch) ? "专科" : "本科",
    website: detail?.WebSite?.trim() || undefined,
  };
}

/** 判断科类是否匹配 */
export function matchSubjectType(
  apiTypeName: string,
  subjectType: "物理类" | "历史类" | "综合",
): boolean {
  if (subjectType === "综合") {
    return true;
  }
  if (subjectType === "物理类") {
    return /物理|理科/.test(apiTypeName);
  }
  return /历史|文科/.test(apiTypeName);
}

function parseNumber(value: string): number {
  const num = Number.parseInt(value, 10);
  return Number.isFinite(num) ? num : 0;
}

/** 将 API 招生计划转为本地结构 */
export function mapEnrollmentPlan(item: GuguEnrollmentPlan): EnrollmentPlan {
  return {
    id: item.DataId,
    schoolUuid: item.SchoolUUID,
    schoolName: item.SchoolName,
    majorName: item.CollegeMajorName,
    shortMajorName: item.ShortCollegeMajorName || item.CollegeMajorName,
    majorCode: item.CollegeMajorCode,
    recruitCode: item.RecruitCode,
    enrollmentNumbers: parseNumber(item.EnrollmentNumbers),
    tuition: parseNumber(item.Tuition),
    batchName: item.BatchName,
    subjectType: item.Type,
    provinceName: item.ProvinceName,
    year: parseNumber(item.Year),
    courseSelectionRequirements: item.CourseSelectionRequirements,
    inSchoolYears: item.InSchoolYears,
    classOne: item.ClassOne,
    classTwo: item.ClassTwo,
    specialGroupName: item.SpecialGroupName,
    dataSource: "api",
  };
}

/** 从招生计划提取院校热门专业名 */
export function extractMajorsFromPlans(plans: EnrollmentPlan[], limit = 6): string[] {
  const names = plans.map((plan) => plan.shortMajorName).filter(Boolean);
  return [...new Set(names)].slice(0, limit);
}

/** 用招生计划覆盖院校专业列表 */
export function enrichUniversityWithPlans(
  university: University,
  plans: EnrollmentPlan[],
): University {
  if (plans.length === 0) {
    return university;
  }
  return {
    ...university,
    hotMajors: extractMajorsFromPlans(plans),
  };
}
