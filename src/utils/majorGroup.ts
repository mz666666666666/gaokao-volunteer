import type { EnrollmentPlan } from "../types";

/** 格式化 2026 专业组代码，如 10596-01 */
export function formatMajorGroupCode(plan: EnrollmentPlan): string {
  const groupNo = plan.specialGroupName.replace(/[（）()\s]/g, "") || "01";
  const recruitCode = plan.recruitCode || "00000";
  return `${recruitCode}-${groupNo.padStart(2, "0")}`;
}

export interface MajorGroupBucket {
  groupCode: string;
  groupName: string;
  plans: EnrollmentPlan[];
}

/** 按专业组聚合招生计划 */
export function groupPlansByMajorGroup(plans: EnrollmentPlan[]): MajorGroupBucket[] {
  const map = new Map<string, MajorGroupBucket>();

  for (const plan of plans) {
    const groupCode = formatMajorGroupCode(plan);
    const existing = map.get(groupCode);
    if (existing) {
      existing.plans.push(plan);
      continue;
    }
    map.set(groupCode, {
      groupCode,
      groupName: plan.specialGroupName || "默认组",
      plans: [plan],
    });
  }

  return Array.from(map.values()).sort((a, b) => a.groupCode.localeCompare(b.groupCode));
}
