import { useCallback, useEffect, useState } from "react";
import {
  isDemoApiMode,
  loadEnrollmentPlansByProvince,
  loadEnrollmentPlansForSchool,
} from "../api/gugudata";
import { provinces } from "../data/provinces";
import { queryLocalEnrollmentPlans } from "../data/nationwideEnrollmentPlans";
import { filterEnrollmentPlansByTarget } from "../utils/enrollmentPlanFilter";
import type { DataSourceMode, EnrollmentPlan } from "../types";

interface UseEnrollmentPlansOptions {
  provinceNames: string[];
  activeProvince?: string;
  schoolName?: string;
  schoolUuid?: string;
  majorKeyword?: string;
  hotMajors?: string[];
  source: DataSourceMode;
  enabled?: boolean;
}

interface UseEnrollmentPlansResult {
  plans: EnrollmentPlan[];
  loading: boolean;
  error: string | null;
  syncedProvinces: string[];
  reload: () => void;
}

function loadLocalPlans(
  queryProvinces: string[],
  options: Pick<
    UseEnrollmentPlansOptions,
    "schoolName" | "schoolUuid" | "majorKeyword" | "hotMajors"
  >,
): EnrollmentPlan[] {
  return queryProvinces.flatMap((provinceName) =>
    queryLocalEnrollmentPlans({
      provinceName,
      schoolName: options.schoolName,
      schoolUuid: options.schoolUuid,
      majorKeyword: options.majorKeyword,
      hotMajors: options.hotMajors,
    }),
  );
}

export function useEnrollmentPlans(
  options: UseEnrollmentPlansOptions,
): UseEnrollmentPlansResult {
  const {
    provinceNames,
    activeProvince,
    schoolName,
    schoolUuid,
    majorKeyword,
    hotMajors,
    source,
    enabled = true,
  } = options;

  const [plans, setPlans] = useState<EnrollmentPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const syncedProvinces = [...provinces];
  const queryProvinces = activeProvince ? [activeProvince] : provinceNames.filter(Boolean);
  const hasSchoolFilter = Boolean(schoolName?.trim() || schoolUuid);
  const useLocalPlans = source === "local" || isDemoApiMode();

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!enabled || queryProvinces.length === 0) {
      return;
    }

    let cancelled = false;

    async function fetchPlans() {
      setLoading(true);
      setError(null);

      try {
        // Demo 接口忽略学校/省份参数，固定返回样例数据，必须走本地库
        if (useLocalPlans) {
          const list = loadLocalPlans(queryProvinces, {
            schoolName,
            schoolUuid,
            majorKeyword,
            hotMajors,
          });
          if (!cancelled) {
            setPlans(list);
            if (isDemoApiMode() && source === "api") {
              setError(null);
            }
          }
          return;
        }

        const list = hasSchoolFilter
          ? await loadEnrollmentPlansForSchool({
              provinceName: queryProvinces[0],
              schoolName,
              schoolUuid,
            })
          : await loadEnrollmentPlansByProvince({
              provinceName: queryProvinces[0],
              majorKeyword,
              maxPages: 5,
            });

        const filtered = filterEnrollmentPlansByTarget(list, {
          schoolName: hasSchoolFilter ? schoolName : undefined,
          schoolUuid: hasSchoolFilter ? schoolUuid : undefined,
          majorKeyword,
        });

        const finalList =
          filtered.length > 0
            ? filtered
            : loadLocalPlans(queryProvinces, { schoolName, schoolUuid, majorKeyword, hotMajors });

        if (!cancelled) {
          setPlans(finalList);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : "加载招生计划失败";
        setError(message);
        setPlans(loadLocalPlans(queryProvinces, { schoolName, schoolUuid, majorKeyword, hotMajors }));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchPlans();
    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    queryProvinces.join("|"),
    schoolName,
    schoolUuid,
    majorKeyword,
    hotMajors,
    source,
    useLocalPlans,
    hasSchoolFilter,
    reloadToken,
  ]);

  return { plans, loading, error, syncedProvinces, reload };
}
