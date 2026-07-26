import type { EnrollmentPlan, MajorStrengthLevel, University } from "../types";

/** 各校王牌专业关键词 */
const schoolFlagshipMap: Record<string, string[]> = {
  桂林理工大学: ["地质", "测绘", "土木", "资源勘查", "环境工程"],
  武汉大学: ["法学", "遥感", "测绘", "计算机", "口腔"],
  华中科技大学: ["机械", "光电", "计算机", "医学"],
  山东大学: ["数学", "化学", "计算机", "医学"],
  三峡大学: ["电气", "水利", "土木"],
  青岛大学: ["纺织", "医学", "计算机"],
  烟台大学: ["法学", "计算机"],
  湖北大学: ["化学", "材料", "计算机"],
  武汉理工大学: ["材料", "船舶", "汽车", "计算机"],
  中南民族大学: ["民族学", "计算机"],
  广西大学: ["土木", "化学", "计算机"],
};

const specialBatchPattern =
  /国家专项|地方专项|省内专项|高校专项|乡村振兴|对口|南疆|预科|定向|协作|少数民族|公费|优师|免费|专项计划/;

export function classifyMajorStrength(
  plan: EnrollmentPlan,
  university: University,
): MajorStrengthLevel {
  const text = `${plan.batchName}${plan.specialGroupName}${plan.majorName}`;
  if (specialBatchPattern.test(text)) {
    return "special";
  }

  if (university.hotMajors.includes(plan.shortMajorName)) {
    return "flagship";
  }

  const flagshipKeywords = schoolFlagshipMap[university.name] ?? [];
  if (flagshipKeywords.some((keyword) => plan.shortMajorName.includes(keyword))) {
    return "flagship";
  }

  return "normal";
}

export function getMajorStrengthLabel(level: MajorStrengthLevel): string {
  switch (level) {
    case "flagship":
      return "王牌专业";
    case "special":
      return "省重点/国家专项";
    default:
      return "普通专业";
  }
}

export function getMajorStrengthClassName(level: MajorStrengthLevel): string {
  switch (level) {
    case "flagship":
      return "major-flagship";
    case "special":
      return "major-special";
    default:
      return "major-normal";
  }
}
