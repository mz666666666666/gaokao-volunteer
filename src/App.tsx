import { useEffect, useMemo, useState } from "react";
import { provinces } from "./data/universities";
import { EnrollmentPlanTable } from "./components/EnrollmentPlanTable";
import { SchoolSearchPanel } from "./components/SchoolSearchPanel";
import { MatchMajorGroups } from "./components/MatchMajorGroups";
import { TeacherPortrait } from "./components/TeacherPortrait";
import { useCollegeData, usePlanProvinces } from "./hooks/useCollegeData";
import { useEnrollmentPlans } from "./hooks/useEnrollmentPlans";
import { useScoreRank } from "./hooks/useScoreRank";
import type {
  BatchFilter,
  DataSourceMode,
  EnrollmentPlan,
  StudentProfile,
  VolunteerItem,
} from "./types";
import { MAX_RESULTS_PER_RISK, getRiskDescription, groupMatchesByRisk, matchUniversities } from "./utils/match";
import { getBatchLabel } from "./utils/batch";
import { exportVolunteerPdf } from "./utils/exportPdf";
import { GAOKAO_DATA_YEAR, MAX_VOLUNTEERS } from "./constants/gaokao";
import "./App.css";

const defaultProfile: StudentProfile = {
  name: "",
  province: "山东",
  score: 538,
  rank: 71699,
  subjectType: "物理类",
  batchFilter: "本科",
  preferredProvinces: ["山东", "江苏", "广东"],
  preferredMajors: ["计算机科学与技术", "软件工程"],
};

type TabKey = "profile" | "match" | "search" | "plans" | "list";

const batchOptions: BatchFilter[] = ["本科", "专科", "全部"];

function toggleItem(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function App() {
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [volunteers, setVolunteers] = useState<VolunteerItem[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [dataSource, setDataSource] = useState<DataSourceMode>("local");
  const [planSchoolKeyword, setPlanSchoolKeyword] = useState("");
  const [planMajorKeyword, setPlanMajorKeyword] = useState("");
  const [planProvince, setPlanProvince] = useState("");
  const [manualRank, setManualRank] = useState(false);
  const [majorKeyword, setMajorKeyword] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [majorOptions, setMajorOptions] = useState<string[]>([]);
  const [majorsLoading, setMajorsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    import("./data/majors")
      .then((module) => {
        if (!cancelled) {
          setMajorOptions(module.majorOptions);
          setMajorsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMajorOptions(["计算机科学与技术", "软件工程", "会计学"]);
          setMajorsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planProvinces = usePlanProvinces(profile);
  const activePlanProvince = planProvince || profile.province;

  const { rank: autoRank, rankRange, rankSource, loading: rankLoading } = useScoreRank({
    score: profile.score,
    province: profile.province,
    subjectType: profile.subjectType,
    source: dataSource,
  });

  useEffect(() => {
    if (!manualRank && autoRank > 0) {
      setProfile((prev) => ({ ...prev, rank: autoRank }));
    }
  }, [autoRank, manualRank]);

  const { universities, loading, error, apiModeLabel, reload } = useCollegeData(
    profile,
    dataSource,
  );

  const {
    plans: provincePlans,
    loading: plansLoading,
    error: plansError,
    syncedProvinces,
    reload: reloadPlans,
  } = useEnrollmentPlans({
    provinceNames: planProvinces,
    activeProvince: activeTab === "plans" ? activePlanProvince : undefined,
    schoolName: planSchoolKeyword || undefined,
    majorKeyword: planMajorKeyword || undefined,
    source: dataSource,
    enabled: activeTab === "plans",
  });

  const matches = useMemo(
    () => matchUniversities(profile, universities),
    [profile, universities],
  );
  const grouped = useMemo(() => groupMatchesByRisk(matches), [matches]);

  const filteredMajorOptions = useMemo(() => {
    const keyword = majorKeyword.trim().toLowerCase();
    if (!keyword) {
      const popular = [
        "计算机科学与技术",
        "软件工程",
        "人工智能",
        "临床医学",
        "会计学",
        "法学",
        "电子信息工程",
        "土木工程",
        "汉语言文学",
        "英语",
      ];
      return [...new Set([...profile.preferredMajors, ...popular])];
    }
    return majorOptions
      .filter((item) => item.toLowerCase().includes(keyword))
      .slice(0, 60);
  }, [majorKeyword, profile.preferredMajors]);

  const addVolunteer = (
    universityId: string,
    major: string,
    risk: "冲" | "稳" | "保",
    extra?: Pick<VolunteerItem, "recruitCode" | "majorCode" | "enrollmentNumbers">,
  ) => {
    if (volunteers.some((item) => item.universityId === universityId && item.major === major)) {
      window.alert("该院校专业已在志愿表中");
      return;
    }
    if (volunteers.length >= MAX_VOLUNTEERS) {
      window.alert(`最多添加 ${MAX_VOLUNTEERS} 个志愿`);
      return;
    }
    setVolunteers((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        universityId,
        major,
        risk,
        ...extra,
      },
    ]);
    setActiveTab("list");
  };

  const addVolunteerFromPlan = (plan: EnrollmentPlan, risk: "冲" | "稳" | "保" = "稳") => {
    addVolunteer(
      plan.schoolUuid || plan.schoolName,
      plan.shortMajorName,
      risk,
      {
        recruitCode: plan.recruitCode,
        majorCode: plan.majorCode,
        enrollmentNumbers: plan.enrollmentNumbers,
      },
    );
  };

  const removeVolunteer = (order: number) => {
    setVolunteers((prev) =>
      prev
        .filter((item) => item.order !== order)
        .map((item, index) => ({ ...item, order: index + 1 })),
    );
  };

  const moveVolunteer = (order: number, direction: "up" | "down") => {
    setVolunteers((prev) => {
      const index = prev.findIndex((item) => item.order === order);
      if (index === -1) {
        return prev;
      }
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  const findUniversityName = (universityId: string) =>
    universities.find((entry) => entry.id === universityId)?.name ?? universityId;

  const findUniversity = (universityId: string) =>
    universities.find((entry) => entry.id === universityId);

  const handleExportPdf = async () => {
    if (volunteers.length === 0) {
      window.alert("还没有志愿，无法导出");
      return;
    }
    setExportingPdf(true);
    try {
      await exportVolunteerPdf({
        profile,
        volunteers,
        findUniversity,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "导出失败，请稍后重试";
      window.alert(message);
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-content">
          <p className="eyebrow">孟老师带你填完完美高考志愿</p>
          <h1>高考志愿填报助手</h1>
          <p className="subtitle">
            输入分数与偏好，系统会给出冲稳保推荐，并展示 {GAOKAO_DATA_YEAR} 年专业组代码与 {GAOKAO_DATA_YEAR - 1} 年录取参考。
          </p>
          <p className="data-source-tag">
            数据年份：{GAOKAO_DATA_YEAR} · 数据源：{dataSource === "api" ? apiModeLabel : "本地示例数据"}
            {loading && " · 加载中..."}
            {error && ` · ${error}`}
          </p>
        </div>
        <div className="hero-showcase">
          <TeacherPortrait />
          <p className="teacher-slogan">孟老师带你填完完美高考志愿</p>
        </div>
        <div className="hero-card">
          <div>
            <span>当前分数</span>
            <strong>{profile.score}</strong>
          </div>
          <div>
            <span>当前位次</span>
            <strong>{profile.rank}</strong>
          </div>
          <div>
            <span>已填志愿</span>
            <strong>{volunteers.length}/{MAX_VOLUNTEERS}</strong>
          </div>
        </div>
      </header>

      <nav className="tabs">
        <button
          type="button"
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          1. 填写信息
        </button>
        <button
          type="button"
          className={activeTab === "match" ? "active" : ""}
          onClick={() => setActiveTab("match")}
        >
          2. 院校推荐
        </button>
        <button
          type="button"
          className={activeTab === "search" ? "active" : ""}
          onClick={() => setActiveTab("search")}
        >
          3. 院校查询
        </button>
        <button
          type="button"
          className={activeTab === "plans" ? "active" : ""}
          onClick={() => setActiveTab("plans")}
        >
          4. 招生计划
        </button>
        <button
          type="button"
          className={activeTab === "list" ? "active" : ""}
          onClick={() => setActiveTab("list")}
        >
          5. 我的志愿表
        </button>
      </nav>

      <main>
        {activeTab === "profile" && (
          <section className="panel">
            <h2>考生基本信息</h2>
            <div className="form-grid">
              <label>
                姓名
                <input
                  value={profile.name}
                  onChange={(event) =>
                    setProfile({ ...profile, name: event.target.value })
                  }
                  placeholder="请输入姓名"
                />
              </label>
              <label>
                所在省份
                <select
                  value={profile.province}
                  onChange={(event) => {
                    setManualRank(false);
                    setPlanProvince("");
                    setProfile({ ...profile, province: event.target.value });
                  }}
                >
                  {provinces.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                高考分数
                <input
                  type="number"
                  value={profile.score}
                  onChange={(event) => {
                    setManualRank(false);
                    setProfile({
                      ...profile,
                      score: Number(event.target.value) || 0,
                    });
                  }}
                />
              </label>
              <label>
                全省位次
                <input
                  type="number"
                  value={profile.rank}
                  readOnly={!manualRank}
                  onChange={(event) =>
                    setProfile({
                      ...profile,
                      rank: Number(event.target.value) || 0,
                    })
                  }
                />
                <span className="field-hint">
                  {rankLoading
                    ? "位次计算中..."
                    : manualRank
                      ? "手动模式"
                      : `自动匹配（${rankSource === "api" ? "API" : "本地估算"}${rankRange ? ` · ${rankRange}` : ""}）`}
                </span>
              </label>
              <label className="source-option rank-mode">
                <input
                  type="checkbox"
                  checked={manualRank}
                  onChange={(event) => setManualRank(event.target.checked)}
                />
                手动修改位次（取消后随分数自动更新）
              </label>
              <label>
                科类
                <select
                  value={profile.subjectType}
                  onChange={(event) => {
                    setManualRank(false);
                    setProfile({
                      ...profile,
                      subjectType: event.target.value as StudentProfile["subjectType"],
                    });
                  }}
                >
                  <option value="物理类">物理类</option>
                  <option value="历史类">历史类</option>
                  <option value="综合">综合</option>
                </select>
              </label>
            </div>

            <h3>招生层次</h3>
            <div className="segment-group">
              {batchOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={profile.batchFilter === item ? "segment active" : "segment"}
                  onClick={() => setProfile({ ...profile, batchFilter: item })}
                >
                  {item === "全部" ? "本科 + 专科" : item}
                </button>
              ))}
            </div>

            <h3>意向省份</h3>
            <div className="chip-group">
              {provinces.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={
                    profile.preferredProvinces.includes(item) ? "chip active" : "chip"
                  }
                  onClick={() =>
                    setProfile({
                      ...profile,
                      preferredProvinces: toggleItem(profile.preferredProvinces, item),
                    })
                  }
                >
                  {item}
                </button>
              ))}
            </div>

            <h3>意向专业</h3>
            <div className="major-filter">
              <input
                value={majorKeyword}
                onChange={(event) => setMajorKeyword(event.target.value)}
                placeholder="搜索专业，如：计算机、护理、会计"
              />
              <span className="major-count">
                {majorsLoading
                  ? "专业库加载中..."
                  : `共 ${majorOptions.length} 个专业`}
                {majorKeyword.trim() && !majorsLoading
                  ? `，匹配 ${filteredMajorOptions.length} 个`
                  : ""}
              </span>
            </div>
            <div className="chip-group chip-group-scroll">
              {!majorKeyword.trim() && (
                <p className="major-hint">默认展示常见专业，输入关键词可搜索全部 {majorOptions.length} 个专业</p>
              )}
              {majorKeyword.trim() && filteredMajorOptions.length === 0 ? (
                <div className="empty inline-empty">未找到匹配专业</div>
              ) : (
                filteredMajorOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={
                      profile.preferredMajors.includes(item) ? "chip active" : "chip"
                    }
                    onClick={() =>
                      setProfile({
                        ...profile,
                        preferredMajors: toggleItem(profile.preferredMajors, item),
                      })
                    }
                  >
                    {item}
                  </button>
                ))
              )}
            </div>

            <h3>数据来源</h3>
            <div className="source-switch">
              <label className="source-option">
                <input
                  type="radio"
                  name="dataSource"
                  checked={dataSource === "api"}
                  onChange={() => setDataSource("api")}
                />
                全国高校 API（分数线 + 招生计划）
              </label>
              <label className="source-option">
                <input
                  type="radio"
                  name="dataSource"
                  checked={dataSource === "local"}
                  onChange={() => setDataSource("local")}
                />
                本地示例数据（离线可用）
              </label>
              {dataSource === "api" && (
                <button type="button" className="ghost" onClick={reload}>
                  重新拉取 API 数据
                </button>
              )}
            </div>

            <button className="primary" type="button" onClick={() => setActiveTab("match")}>
              生成推荐院校
            </button>
          </section>
        )}

        {activeTab === "match" && (
          <section className="panel">
            <div className="panel-head">
              <h2>智能推荐</h2>
              <p>
                当前层次：{getBatchLabel(profile.batchFilter)} · 每档最多展示 {MAX_RESULTS_PER_RISK} 所 ·
                含 {GAOKAO_DATA_YEAR} 专业组代码与 {GAOKAO_DATA_YEAR - 1} 年录取参考
              </p>
            </div>

            <div className="segment-group">
              {batchOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={profile.batchFilter === item ? "segment active" : "segment"}
                  onClick={() => setProfile({ ...profile, batchFilter: item })}
                >
                  {item === "全部" ? "本科 + 专科" : item}
                </button>
              ))}
            </div>

            {loading && <div className="empty">正在从全国高校 API 加载数据...</div>}
            {!loading && error && (
              <div className="error-banner">
                API 加载失败，已回退到本地示例数据。{error}
              </div>
            )}

            <div className="risk-summary">
              {(["冲", "稳", "保"] as const).map((risk) => (
                <div key={risk} className={`summary-card ${risk}`}>
                  <strong>{risk}</strong>
                  <span>
                    {grouped[risk].length}/{MAX_RESULTS_PER_RISK} 所
                  </span>
                  <em>{getRiskDescription(risk)}</em>
                </div>
              ))}
            </div>

            {(["冲", "稳", "保"] as const).map((risk) => (
              <div key={risk} className="risk-section">
                <div className="risk-section-head">
                  <h3>
                    {risk === "冲"
                      ? "冲刺院校"
                      : risk === "稳"
                        ? "稳妥院校"
                        : "保底院校"}
                  </h3>
                  <span className="risk-limit">最多 {MAX_RESULTS_PER_RISK} 所</span>
                </div>
                {grouped[risk].length === 0 ? (
                  <div className="empty small">暂无符合条件的院校</div>
                ) : (
                  <div className="match-list">
                    {grouped[risk].map((item) => (
                      <article key={item.university.id} className={`match-card risk-${item.risk}`}>
                        <div className="match-top">
                          <div>
                            <h3>{item.university.name}</h3>
                            <p>
                              {item.university.province} · {item.university.city} ·{" "}
                              {item.university.level} · {item.university.batchLevel ?? "本科"}
                            </p>
                          </div>
                          <span className={`risk ${item.risk}`}>{item.risk}</span>
                        </div>
                        <div className="match-meta">
                          <span>{GAOKAO_DATA_YEAR} 最低分：{item.university.minScore}</span>
                          <span>{GAOKAO_DATA_YEAR} 最低位次：{item.university.minRank}</span>
                          <span>
                            分数差：{item.scoreGap > 0 ? "+" : ""}
                            {item.scoreGap}
                          </span>
                          <span>匹配度：{item.matchScore}</span>
                        </div>
                        <MatchMajorGroups
                          university={item.university}
                          provinceName={profile.province}
                          dataSource={dataSource}
                          risk={item.risk}
                          onAdd={addVolunteerFromPlan}
                        />
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {activeTab === "search" && (
          <section className="panel">
            <SchoolSearchPanel
              universities={universities}
              profile={profile}
              dataSource={dataSource}
              onAddVolunteer={addVolunteer}
              onAddFromPlan={addVolunteerFromPlan}
            />
          </section>
        )}

        {activeTab === "plans" && (
          <section className="panel">
            <div className="panel-head">
              <h2>各校招生计划</h2>
              <p>
                已同步全国 {syncedProvinces.length} 个省份的 {GAOKAO_DATA_YEAR} 年招生计划
              </p>
            </div>

            <div className="plan-filters form-grid">
              <label>
                查看省份
                <select
                  value={activePlanProvince}
                  onChange={(event) => setPlanProvince(event.target.value)}
                >
                  {planProvinces.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                学校名称
                <input
                  value={planSchoolKeyword}
                  onChange={(event) => setPlanSchoolKeyword(event.target.value)}
                  placeholder="如：山东大学"
                />
              </label>
              <label>
                专业关键词
                <input
                  value={planMajorKeyword}
                  onChange={(event) => setPlanMajorKeyword(event.target.value)}
                  placeholder="如：计算机"
                />
              </label>
            </div>

            <div className="plan-actions">
              <button type="button" className="ghost" onClick={reloadPlans}>
                刷新招生计划
              </button>
              <span className="plan-count">
                {activePlanProvince} 共 {provincePlans.length} 条计划
              </span>
            </div>

            <EnrollmentPlanTable
              plans={provincePlans}
              loading={plansLoading}
              error={plansError}
              emptyText={`${activePlanProvince} 暂无招生计划数据，请尝试更换关键词`}
              onAdd={(plan) => addVolunteerFromPlan(plan)}
              showAddButton
              showProvince
            />
          </section>
        )}

        {activeTab === "list" && (
          <section className="panel">
            <div className="panel-head panel-head-row">
              <div>
                <h2>我的志愿表</h2>
                <p>支持调整顺序，数据保存在当前浏览器会话中；导出时将打开打印窗口，请选择「另存为 PDF」</p>
              </div>
              {volunteers.length > 0 && (
                <button
                  type="button"
                  className="primary"
                  disabled={exportingPdf}
                  onClick={handleExportPdf}
                >
                  {exportingPdf ? "正在打开…" : "导出 PDF"}
                </button>
              )}
            </div>
            {volunteers.length === 0 ? (
              <div className="empty">还没有志愿，请先去“院校推荐”或“招生计划”添加。</div>
            ) : (
              <div className="volunteer-list">
                {volunteers.map((item) => (
                  <article key={item.order} className="volunteer-card">
                    <div className="order">{item.order}</div>
                    <div className="volunteer-body">
                      <h3>{findUniversityName(item.universityId)}</h3>
                      <p>
                        {item.major}
                        {item.enrollmentNumbers ? ` · 招生 ${item.enrollmentNumbers} 人` : ""}
                        {item.recruitCode ? ` · 院校代码 ${item.recruitCode}` : ""}
                      </p>
                      <span className={`risk ${item.risk}`}>{item.risk}</span>
                    </div>
                    <div className="actions">
                      <button type="button" onClick={() => moveVolunteer(item.order, "up")}>
                        上移
                      </button>
                      <button type="button" onClick={() => moveVolunteer(item.order, "down")}>
                        下移
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => removeVolunteer(item.order)}
                      >
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
