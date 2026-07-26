import { useEnrollmentPlans } from "../hooks/useEnrollmentPlans";
import { getPreviousYearLabel, lookupHistoricalAdmission } from "../data/historicalAdmission";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";
import type { DataSourceMode, EnrollmentPlan, University } from "../types";
import {
  classifyMajorStrength,
  getMajorStrengthClassName,
  getMajorStrengthLabel,
} from "../utils/majorStrength";
import { formatMajorGroupCode, groupPlansByMajorGroup } from "../utils/majorGroup";

interface MatchMajorGroupsProps {
  university: University;
  provinceName: string;
  dataSource: DataSourceMode;
  risk: "冲" | "稳" | "保";
  onAdd: (plan: EnrollmentPlan, risk: "冲" | "稳" | "保") => void;
}

function enrichPlan(plan: EnrollmentPlan, university: University): EnrollmentPlan {
  const historical = lookupHistoricalAdmission(
    plan.schoolName,
    plan.shortMajorName,
    university.minScore,
  );
  return {
    ...plan,
    majorStrength: classifyMajorStrength(plan, university),
    prevYearMinScore: historical?.minScore,
    prevYearMinRank: historical?.minRank,
  };
}

export function MatchMajorGroups({
  university,
  provinceName,
  dataSource,
  risk,
  onAdd,
}: MatchMajorGroupsProps) {
  const { plans, loading, error } = useEnrollmentPlans({
    provinceNames: [provinceName],
    schoolName: university.name,
    schoolUuid: university.schoolUuid,
    hotMajors: university.hotMajors,
    source: dataSource,
    enabled: true,
  });

  const enrichedPlans = plans.map((plan) => enrichPlan(plan, university));
  const groups = groupPlansByMajorGroup(enrichedPlans);
  const previousYear = getPreviousYearLabel();

  return (
    <div className="match-major-groups">
      <div className="major-legend">
        <span className="legend-item major-flagship">红色 · 王牌专业</span>
        <span className="legend-item major-special">蓝色 · 省重点/国家专项</span>
        <span className="legend-item major-normal">绿色 · 普通专业</span>
      </div>

      {loading && <div className="empty small">正在加载 {GAOKAO_DATA_YEAR} 年专业组数据...</div>}
      {!loading && error && <div className="error-banner small">{error}</div>}

      {!loading && groups.length === 0 && (
        <div className="empty small">暂无 {GAOKAO_DATA_YEAR} 年招生计划，请切换数据源或稍后重试</div>
      )}

      {groups.map((group) => (
        <div key={group.groupCode} className="major-group-block">
          <div className="major-group-head">
            <strong>{GAOKAO_DATA_YEAR} 专业组 {group.groupName}</strong>
            <span className="group-code">代码 {group.groupCode}</span>
          </div>
          <div className="plan-table-wrap">
            <table className="plan-table major-group-table">
              <thead>
                <tr>
                  <th>专业名称</th>
                  <th>{GAOKAO_DATA_YEAR} 招生</th>
                  <th>{previousYear} 最低分</th>
                  <th>{previousYear} 最低位次</th>
                  <th>类型</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {group.plans.map((plan) => {
                  const strength = plan.majorStrength ?? "normal";
                  return (
                    <tr key={plan.id} className={getMajorStrengthClassName(strength)}>
                      <td>
                        <strong>{plan.shortMajorName}</strong>
                        <span className="plan-sub">{formatMajorGroupCode(plan)}</span>
                      </td>
                      <td>{plan.enrollmentNumbers || "-"}</td>
                      <td>{plan.prevYearMinScore ?? "-"}</td>
                      <td>{plan.prevYearMinRank ?? "-"}</td>
                      <td>
                        <span className={`major-tag ${getMajorStrengthClassName(strength)}`}>
                          {getMajorStrengthLabel(strength)}
                        </span>
                      </td>
                      <td>
                        <button type="button" className="ghost" onClick={() => onAdd(plan, risk)}>
                          加入志愿
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
