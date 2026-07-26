import { useCallback, useEffect, useMemo, useState } from "react";
import { provinces } from "../data/provinces";
import { universities as localUniversities } from "../data/universities";
import { getApiModeLabel, loadUniversitiesFromApi } from "../api/gugudata";
import type { DataSourceMode, StudentProfile, University } from "../types";

interface UseCollegeDataResult {
  universities: University[];
  loading: boolean;
  error: string | null;
  dataSource: DataSourceMode;
  apiModeLabel: string;
  reload: () => void;
}

export function useCollegeData(
  profile: StudentProfile,
  source: DataSourceMode,
): UseCollegeDataResult {
  const [universities, setUniversities] = useState<University[]>(localUniversities);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    if (source === "local") {
      setUniversities(localUniversities.map((item) => ({ ...item, dataSource: "local" })));
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const list = await loadUniversitiesFromApi({
          enrollProvince: profile.province,
          subjectType: profile.subjectType,
          userScore: profile.score,
        });
        if (cancelled) {
          return;
        }
        if (list.length === 0) {
          throw new Error("未获取到院校数据，请检查省份或稍后重试");
        }
        setUniversities(list);
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : "加载院校数据失败";
        setError(message);
        setUniversities(localUniversities.map((item) => ({ ...item, dataSource: "local" })));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [source, profile.province, profile.subjectType, profile.score, reloadToken]);

  return {
    universities,
    loading,
    error,
    dataSource: source,
    apiModeLabel: getApiModeLabel(),
    reload,
  };
}

/** 招生计划同步范围：全国 31 省 */
export function usePlanProvinces(_profile: StudentProfile): string[] {
  return useMemo(() => [...provinces], []);
}
