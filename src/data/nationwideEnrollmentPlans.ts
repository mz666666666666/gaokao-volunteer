import type { EnrollmentPlan, University } from "../types";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";
import { provinces } from "./provinces";
import { nationalColleges } from "./nationalColleges.generated";
import { localEnrollmentPlans } from "./enrollmentPlans";
import {
  filterEnrollmentPlansByTarget,
  matchEnrollmentPlanToSchool,
} from "../utils/enrollmentPlanFilter";

const templateMajors = [
  { name: "计算机科学与技术", code: "080901", classTwo: "计算机类", classOne: "工学" },
  { name: "软件工程", code: "080902", classTwo: "计算机类", classOne: "工学" },
  { name: "会计学", code: "120203", classTwo: "工商管理类", classOne: "管理学" },
  { name: "汉语言文学", code: "050101", classTwo: "中国语言文学类", classOne: "文学" },
  { name: "临床医学", code: "100201", classTwo: "临床医学类", classOne: "医学" },
];

function resolveCollege(schoolUuid?: string, schoolName?: string): University | undefined {
  if (schoolUuid) {
    const byId = nationalColleges.find((item) => item.id === schoolUuid);
    if (byId) {
      return byId;
    }
  }
  if (schoolName) {
    return nationalColleges.find(
      (item) =>
        item.name === schoolName ||
        item.name.includes(schoolName) ||
        schoolName.includes(item.name),
    );
  }
  return undefined;
}

/** 为指定院校 + 招生省份生成演示招生计划（仅该院校） */
export function buildSchoolTemplatePlans(options: {
  enrollProvince: string;
  schoolUuid?: string;
  schoolName?: string;
  hotMajors?: string[];
}): EnrollmentPlan[] {
  const college = resolveCollege(options.schoolUuid, options.schoolName);
  if (!college && !options.schoolName) {
    return [];
  }

  const schoolUuid = college?.id ?? options.schoolUuid ?? options.schoolName ?? "unknown";
  const schoolName = college?.name ?? options.schoolName ?? "未知院校";
  const majorNames =
    options.hotMajors?.length && options.hotMajors.length > 0
      ? options.hotMajors
      : college?.hotMajors?.length
        ? college.hotMajors
        : templateMajors.slice(0, 3).map((item) => item.name);

  const batchLevel = college?.batchLevel ?? "本科";

  return majorNames.slice(0, 6).map((majorName, index) => {
    const template =
      templateMajors.find((item) => item.name === majorName) ??
      templateMajors[index % templateMajors.length];
    return {
      id: `tpl-${schoolUuid}-${template.code}-${options.enrollProvince}-${index}`,
      schoolUuid,
      schoolName,
      majorName,
      shortMajorName: majorName,
      majorCode: template.code,
      recruitCode: String(schoolUuid).replace(/\D/g, "").slice(0, 5).padEnd(5, "5"),
      enrollmentNumbers: 35 + index * 12,
      tuition: college?.level === "985" ? 6500 : college?.level === "211" ? 5800 : 5000,
      batchName: batchLevel === "专科" ? "专科批" : "本科批",
      subjectType: "物理类",
      provinceName: options.enrollProvince,
      year: GAOKAO_DATA_YEAR,
      courseSelectionRequirements: "物理必选",
      inSchoolYears: batchLevel === "专科" ? "三年" : "四年",
      classOne: template.classOne,
      classTwo: template.classTwo,
      specialGroupName: `（0${(index % 4) + 1}）`,
      dataSource: "local",
    };
  });
}

function buildProvinceTemplatePlans(provinceName: string): EnrollmentPlan[] {
  const colleges = nationalColleges.filter((item) => item.province === provinceName);
  return colleges.flatMap((college) =>
    buildSchoolTemplatePlans({
      enrollProvince: provinceName,
      schoolUuid: college.id,
      schoolName: college.name,
      hotMajors: college.hotMajors.slice(0, 3),
    }),
  );
}

const provincePlanCache = new Map<string, EnrollmentPlan[]>();

function getProvincePlans(provinceName: string): EnrollmentPlan[] {
  if (!provincePlanCache.has(provinceName)) {
    const explicit = localEnrollmentPlans.filter((plan) => plan.provinceName === provinceName);
    const generated = buildProvinceTemplatePlans(provinceName);
    provincePlanCache.set(provinceName, [...explicit, ...generated]);
  }
  return provincePlanCache.get(provinceName) ?? [];
}

/** 查询本地招生计划：按招生省份；若指定院校则只返回该院校计划 */
export function queryLocalEnrollmentPlans(options: {
  provinceName: string;
  schoolName?: string;
  schoolUuid?: string;
  majorKeyword?: string;
  hotMajors?: string[];
}): EnrollmentPlan[] {
  const hasSchoolFilter = Boolean(options.schoolName?.trim() || options.schoolUuid);

  if (hasSchoolFilter) {
    const explicitMatches = filterEnrollmentPlansByTarget(localEnrollmentPlans, {
      schoolName: options.schoolName,
      schoolUuid: options.schoolUuid,
      majorKeyword: options.majorKeyword,
    }).filter((plan) => plan.provinceName === options.provinceName);

    if (explicitMatches.length > 0) {
      return explicitMatches;
    }

    const generated = buildSchoolTemplatePlans({
      enrollProvince: options.provinceName,
      schoolUuid: options.schoolUuid,
      schoolName: options.schoolName,
      hotMajors: options.hotMajors,
    });

    return filterEnrollmentPlansByTarget(generated, {
      majorKeyword: options.majorKeyword,
    });
  }

  const list = getProvincePlans(options.provinceName);
  return filterEnrollmentPlansByTarget(list, { majorKeyword: options.majorKeyword });
}

export function assertPlansBelongToSchool(
  plans: EnrollmentPlan[],
  options: { schoolName?: string; schoolUuid?: string },
): boolean {
  if (!options.schoolName && !options.schoolUuid) {
    return true;
  }
  return plans.every((plan) => matchEnrollmentPlanToSchool(plan, options));
}

export function getNationwidePlanProvinces(): string[] {
  return [...provinces];
}
