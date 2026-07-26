import type { EnrollmentPlan } from "../types";

interface SchoolFilterOptions {
  schoolName?: string;
  schoolUuid?: string;
  majorKeyword?: string;
}

function normalizeSchoolName(name: string): string {
  return name.trim().replace(/(大学|学院|职业技术学院|职业学院|学校)$/g, "");
}

/** 判断招生计划是否属于目标院校 */
export function matchEnrollmentPlanToSchool(
  plan: EnrollmentPlan,
  options: Pick<SchoolFilterOptions, "schoolName" | "schoolUuid">,
): boolean {
  if (options.schoolUuid && plan.schoolUuid && plan.schoolUuid === options.schoolUuid) {
    return true;
  }

  if (!options.schoolName?.trim()) {
    return Boolean(!options.schoolUuid);
  }

  const keyword = options.schoolName.trim();
  if (plan.schoolName === keyword) {
    return true;
  }
  if (plan.schoolName.includes(keyword) || keyword.includes(plan.schoolName)) {
    return true;
  }

  const normalizedKeyword = normalizeSchoolName(keyword);
  const normalizedPlan = normalizeSchoolName(plan.schoolName);
  return (
    normalizedPlan.includes(normalizedKeyword) ||
    normalizedKeyword.includes(normalizedPlan)
  );
}

/** 按院校 / 专业关键词过滤招生计划 */
export function filterEnrollmentPlansByTarget(
  plans: EnrollmentPlan[],
  options: SchoolFilterOptions,
): EnrollmentPlan[] {
  const hasSchoolFilter = Boolean(options.schoolName?.trim() || options.schoolUuid);

  return plans.filter((plan) => {
    if (hasSchoolFilter && !matchEnrollmentPlanToSchool(plan, options)) {
      return false;
    }
    if (
      options.majorKeyword &&
      !plan.majorName.includes(options.majorKeyword) &&
      !plan.shortMajorName.includes(options.majorKeyword)
    ) {
      return false;
    }
    return true;
  });
}
