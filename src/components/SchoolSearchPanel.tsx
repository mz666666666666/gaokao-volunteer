import { useMemo, useState } from "react";
import { SchoolEnrollmentPlans } from "./SchoolEnrollmentPlans";
import { useSchoolSearch } from "../hooks/useSchoolSearch";
import { resolveSchoolWebsite } from "../data/schoolWebsites";
import { searchableColleges } from "../data/collegeSearchIndex";
import { resolveBatchLevel } from "../utils/batch";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";
import type { DataSourceMode, EnrollmentPlan, StudentProfile, University } from "../types";

interface SchoolSearchPanelProps {
  universities: University[];
  profile: StudentProfile;
  dataSource: DataSourceMode;
  onAddVolunteer: (
    universityId: string,
    major: string,
    risk: "冲" | "稳" | "保",
  ) => void;
  onAddFromPlan: (plan: EnrollmentPlan, risk?: "冲" | "稳" | "保") => void;
}

export function SchoolSearchPanel({
  universities,
  profile,
  dataSource,
  onAddVolunteer,
  onAddFromPlan,
}: SchoolSearchPanelProps) {
  const [keyword, setKeyword] = useState("");
  const [submittedKeyword, setSubmittedKeyword] = useState("");

  const { results, loading, error } = useSchoolSearch({
    keyword: submittedKeyword,
    profile,
    dataSource,
    baseUniversities: universities,
    enabled: Boolean(submittedKeyword.trim()),
  });

  const handleSearch = () => {
    setSubmittedKeyword(keyword.trim());
  };

  const resultHint = useMemo(() => {
    if (!submittedKeyword.trim()) {
      return "";
    }
    if (loading) {
      return "正在搜索全国院校库...";
    }
    if (error) {
      return `远程搜索暂不可用，已展示本地匹配结果。${error}`;
    }
    return `共找到 ${results.length} 所院校`;
  }, [submittedKeyword, loading, error, results.length]);

  return (
    <section className="search-panel">
      <div className="search-hero">
        <div>
          <h2>院校查询</h2>
          <p>输入学校名称，支持简称/模糊搜索全国 {searchableColleges.length}+ 所院校，查看 {GAOKAO_DATA_YEAR} 年分数线与招生计划</p>
        </div>
        <div className="search-box">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearch();
              }
            }}
            placeholder="例如：桂林理工、武汉大学、三峡大学"
          />
          <button type="button" className="primary" onClick={handleSearch}>
            查询
          </button>
        </div>
        {resultHint && <p className="search-hint">{resultHint}</p>}
      </div>

      {!submittedKeyword.trim() && (
        <div className="empty">请输入学校名称开始查询，支持简称（如「桂林理工」）</div>
      )}

      {submittedKeyword.trim() && !loading && results.length === 0 && (
        <div className="empty">未找到「{submittedKeyword}」，请换个关键词试试</div>
      )}

      <div className="search-results">
        {results.map((university) => {
          const scoreGap = profile.score - university.minScore;
          const batchLevel = resolveBatchLevel(university);
          const website = resolveSchoolWebsite(university);
          return (
            <article key={university.id} className="search-card">
              <div className="search-card-head">
                <div>
                  <h3>{university.name}</h3>
                  <p>
                    {university.province} · {university.city} · {university.level}
                  </p>
                  {website && (
                    <a
                      className="school-website-link"
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      访问校园官网 ↗
                    </a>
                  )}
                </div>
                <span className={`batch-tag ${batchLevel}`}>{batchLevel}</span>
              </div>
              <div className="match-meta">
                <span>{GAOKAO_DATA_YEAR} 最低分 {university.minScore || "暂无"}</span>
                <span>最低位次 {university.minRank < 999999 ? university.minRank : "暂无"}</span>
                {university.minScore > 0 && (
                  <span>
                    与你的分数差 {scoreGap > 0 ? "+" : ""}
                    {scoreGap}
                  </span>
                )}
              </div>
              <div className="major-row">
                {university.hotMajors.map((major) => (
                  <button
                    key={major}
                    type="button"
                    className="ghost"
                    onClick={() => onAddVolunteer(university.id, major, "稳")}
                  >
                    加入 {major}
                  </button>
                ))}
              </div>
              <SchoolEnrollmentPlans
                university={university}
                provinceName={profile.province}
                dataSource={dataSource}
                risk="稳"
                onAdd={onAddFromPlan}
              />
            </article>
          );
        })}
      </div>
    </section>
  );
}
