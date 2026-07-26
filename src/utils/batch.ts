import type { BatchFilter, BatchLevel, University } from "../types";

export function resolveBatchLevel(university: University): BatchLevel {
  if (university.batchLevel) {
    return university.batchLevel;
  }
  if (university.level === "专科") {
    return "专科";
  }
  if (university.admissionBatch && /专科/.test(university.admissionBatch)) {
    return "专科";
  }
  return "本科";
}

export function filterUniversitiesByBatch(
  list: University[],
  batchFilter: BatchFilter,
): University[] {
  if (batchFilter === "全部") {
    return list;
  }
  return list.filter((university) => resolveBatchLevel(university) === batchFilter);
}

export function getBatchLabel(batchFilter: BatchFilter): string {
  if (batchFilter === "全部") {
    return "本科 + 专科";
  }
  return batchFilter;
}
