import type { University } from "../types";
import { universities as localUniversities } from "./universities";
import { nationalColleges } from "./nationalColleges.generated";

/** 全国可搜索院校（推荐库 + 全国索引，去重） */
export const searchableColleges: University[] = (() => {
  const map = new Map<string, University>();
  for (const item of [...localUniversities, ...nationalColleges]) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
})();

export { nationalColleges };
