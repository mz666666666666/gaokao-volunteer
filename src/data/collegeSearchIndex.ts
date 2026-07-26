import type { University } from "../types";

let searchableCache: University[] | null = null;

/** 懒加载全国院校索引，减小首屏 JS 体积 */
export async function loadSearchableColleges(): Promise<University[]> {
  if (searchableCache) {
    return searchableCache;
  }

  const [{ nationalColleges }, { universities: localUniversities }] = await Promise.all([
    import("./nationalColleges.generated"),
    import("./universities"),
  ]);

  const map = new Map<string, University>();
  for (const item of [...localUniversities, ...nationalColleges]) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  searchableCache = Array.from(map.values());
  return searchableCache;
}

export const SEARCHABLE_COLLEGE_COUNT_HINT = "400+";
