import { useEffect, useState } from "react";
import { fetchRankByScore, isDemoApiMode } from "../api/gugudata";
import { estimateRankByScore } from "../data/scoreRankTable";
import type { DataSourceMode, StudentProfile } from "../types";

interface UseScoreRankOptions {
  score: number;
  province: string;
  subjectType: StudentProfile["subjectType"];
  source: DataSourceMode;
}

interface UseScoreRankResult {
  rank: number;
  rankRange: string;
  rankSource: "api" | "local" | "manual";
  loading: boolean;
}

export function useScoreRank(options: UseScoreRankOptions): UseScoreRankResult {
  const { score, province, subjectType, source } = options;
  const [rank, setRank] = useState(0);
  const [rankRange, setRankRange] = useState("");
  const [rankSource, setRankSource] = useState<"api" | "local" | "manual">("local");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (score <= 0) {
      return;
    }

    let cancelled = false;

    async function syncRank() {
      setLoading(true);
      try {
        if (source === "local" || isDemoApiMode()) {
          const local = estimateRankByScore(score, province, subjectType);
          if (!cancelled) {
            setRank(local.rank);
            setRankRange(local.rankRange);
            setRankSource("local");
          }
          return;
        }

        const result = await fetchRankByScore({
          provinceName: province,
          subjectType,
          score,
        });
        if (!cancelled) {
          setRank(result.rank);
          setRankRange(result.rankRange);
          setRankSource(result.source);
        }
      } catch {
        if (!cancelled) {
          const local = estimateRankByScore(score, province, subjectType);
          setRank(local.rank);
          setRankRange(local.rankRange);
          setRankSource("local");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    const timer = window.setTimeout(() => {
      void syncRank();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [score, province, subjectType, source]);

  return { rank, rankRange, rankSource, loading };
}
