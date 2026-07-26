import type { University } from "../types";

/** 院校简称 → 全称 */
const schoolAliases: Record<string, string> = {
  北航: "北京航空航天大学",
  北理: "北京理工大学",
  北邮: "北京邮电大学",
  华科: "华中科技大学",
  武大: "武汉大学",
  华师: "华中师范大学",
  川大: "四川大学",
  电子科大: "电子科技大学",
  成电: "电子科技大学",
  西交: "西安交通大学",
  西电: "西安电子科技大学",
  中大: "中山大学",
  华工: "华南理工大学",
  暨大: "暨南大学",
  浙大: "浙江大学",
  南大: "南京大学",
  东大: "东南大学",
  复旦: "复旦大学",
  上交: "上海交通大学",
  上海交大: "上海交通大学",
  同济: "同济大学",
  哈工大: "哈尔滨工业大学",
  吉大: "吉林大学",
  大工: "大连理工大学",
  东北大学: "东北大学",
  兰大: "兰州大学",
  云大: "云南大学",
  广西师大: "广西师范大学",
  桂工: "桂林理工大学",
  桂林理工: "桂林理工大学",
  三峡: "三峡大学",
  青大: "青岛大学",
  山大: "山东大学",
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "");
}

function expandKeyword(keyword: string): string[] {
  const normalized = keyword.trim();
  const variants = new Set<string>([normalized]);
  const aliasTarget = schoolAliases[normalized] ?? schoolAliases[keyword];
  if (aliasTarget) {
    variants.add(aliasTarget);
  }
  return [...variants];
}

/** 子序列匹配：query 字符按顺序出现在 target 中即可 */
function isSubsequenceMatch(target: string, query: string): boolean {
  if (!query) {
    return true;
  }
  let index = 0;
  for (const char of target) {
    if (char === query[index]) {
      index += 1;
      if (index === query.length) {
        return true;
      }
    }
  }
  return false;
}

function scoreSearchMatch(university: University, query: string): number {
  const name = normalizeSearchText(university.name);
  if (name === query) {
    return 100;
  }
  if (name.includes(query)) {
    return 90 - (name.length - query.length);
  }
  if (isSubsequenceMatch(name, query)) {
    return 70 - Math.floor((name.length - query.length) / 2);
  }
  const haystack = normalizeSearchText(
    [university.name, university.province, university.city, university.level, university.id].join(" "),
  );
  if (haystack.includes(query)) {
    return 50;
  }
  return 0;
}

export function searchUniversities(list: University[], keyword: string): University[] {
  const queries = expandKeyword(keyword).map(normalizeSearchText).filter(Boolean);
  if (queries.length === 0) {
    return [];
  }

  return list
    .map((university) => ({
      university,
      score: Math.max(...queries.map((query) => scoreSearchMatch(university, query))),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.university.name.localeCompare(b.university.name, "zh-CN"))
    .map((item) => item.university);
}

/** 合并多个来源的搜索结果并去重 */
export function mergeSearchResults(...lists: University[][]): University[] {
  const map = new Map<string, University>();
  for (const list of lists) {
    for (const item of list) {
      const key = item.schoolUuid ?? item.id;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
  }
  return Array.from(map.values());
}
