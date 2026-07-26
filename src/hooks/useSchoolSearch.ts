import { useEffect, useMemo, useState } from "react";
import { searchCollegesByKeyword } from "../api/gugudata";
import { loadSearchableColleges } from "../data/collegeSearchIndex";
import { mergeSearchResults, searchUniversities } from "../utils/search";
import type { DataSourceMode, StudentProfile, University } from "../types";

interface UseSchoolSearchOptions {
  keyword: string;
  profile: StudentProfile;
  dataSource: DataSourceMode;
  baseUniversities: University[];
  enabled?: boolean;
}

interface UseSchoolSearchResult {
  results: University[];
  loading: boolean;
  error: string | null;
}

export function useSchoolSearch({
  keyword,
  profile,
  dataSource,
  baseUniversities,
  enabled = true,
}: UseSchoolSearchOptions): UseSchoolSearchResult {
  const [remoteResults, setRemoteResults] = useState<University[]>([]);
  const [indexResults, setIndexResults] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedKeyword = keyword.trim();

  const localResults = useMemo(() => {
    if (!trimmedKeyword) {
      return [];
    }
    return searchUniversities(baseUniversities, trimmedKeyword);
  }, [baseUniversities, trimmedKeyword]);

  useEffect(() => {
    if (!enabled || trimmedKeyword.length < 1) {
      setIndexResults([]);
      return;
    }

    let cancelled = false;

    async function searchIndex() {
      try {
        const colleges = await loadSearchableColleges();
        if (!cancelled) {
          setIndexResults(searchUniversities(colleges, trimmedKeyword));
        }
      } catch {
        if (!cancelled) {
          setIndexResults([]);
        }
      }
    }

    void searchIndex();
    return () => {
      cancelled = true;
    };
  }, [enabled, trimmedKeyword]);

  useEffect(() => {
    if (!enabled || trimmedKeyword.length < 1) {
      setRemoteResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchRemote() {
      setLoading(true);
      setError(null);
      try {
        const list = await searchCollegesByKeyword({
          keyword: trimmedKeyword,
          enrollProvince: profile.province,
          subjectType: profile.subjectType,
          source: dataSource,
        });
        if (!cancelled) {
          setRemoteResults(list);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "远程搜索失败";
          setError(message);
          setRemoteResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchRemote();
    return () => {
      cancelled = true;
    };
  }, [enabled, trimmedKeyword, profile.province, profile.subjectType, dataSource]);

  const results = useMemo(
    () => mergeSearchResults(localResults, indexResults, remoteResults).slice(0, 80),
    [localResults, indexResults, remoteResults],
  );

  return { results, loading, error };
}
