import type { EnrollmentPlan } from "../types";
import { GAOKAO_DATA_YEAR } from "../constants/gaokao";

interface EnrollmentPlanTableProps {
  plans: EnrollmentPlan[];
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  onAdd?: (plan: EnrollmentPlan) => void;
  showAddButton?: boolean;
  showProvince?: boolean;
}

export function EnrollmentPlanTable({
  plans,
  loading = false,
  error = null,
  emptyText = "暂无招生计划",
  onAdd,
  showAddButton = false,
  showProvince = false,
}: EnrollmentPlanTableProps) {
  if (loading) {
    return <div className="empty small">正在加载招生计划...</div>;
  }

  if (error) {
    return <div className="error-banner small">{error}</div>;
  }

  if (plans.length === 0) {
    return <div className="empty small">{emptyText}</div>;
  }

  return (
    <div className="plan-table-wrap">
      <table className="plan-table">
        <thead>
          <tr>
            <th>年份</th>
            {showProvince && <th>招生省份</th>}
            <th>学校</th>
            <th>专业</th>
            <th>招生人数</th>
            <th>学费</th>
            <th>批次</th>
            <th>选科要求</th>
            {showAddButton && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {plans.map((plan) => (
            <tr key={plan.id}>
              <td>{plan.year}</td>
              {showProvince && <td>{plan.provinceName}</td>}
              <td>{plan.schoolName}</td>
              <td>
                <strong>{plan.shortMajorName}</strong>
                {plan.majorName !== plan.shortMajorName && (
                  <span className="plan-sub">{plan.majorName}</span>
                )}
              </td>
              <td>{plan.enrollmentNumbers || "-"}</td>
              <td>{plan.tuition ? `¥${plan.tuition}` : "-"}</td>
              <td>{plan.batchName}</td>
              <td>{plan.courseSelectionRequirements || "-"}</td>
              {showAddButton && onAdd && (
                <td>
                  <button type="button" className="ghost" onClick={() => onAdd(plan)}>
                    加入志愿
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface SchoolPlanPanelProps {
  schoolName: string;
  schoolUuid?: string;
  provinceName: string;
  plans: EnrollmentPlan[];
  loading: boolean;
  error: string | null;
  expanded: boolean;
  onToggle: () => void;
  onAdd?: (plan: EnrollmentPlan) => void;
}

export function SchoolPlanPanel({
  schoolName,
  provinceName,
  plans,
  loading,
  error,
  expanded,
  onToggle,
  onAdd,
}: SchoolPlanPanelProps) {
  return (
    <div className="school-plan-panel">
      <button type="button" className="ghost plan-toggle" onClick={onToggle}>
        {expanded ? "收起招生计划" : `查看 ${schoolName} 招生计划 (${plans.length || "..."})`}
      </button>
      {expanded && (
        <>
          <p className="plan-context">
            {GAOKAO_DATA_YEAR} 年 {provinceName} 招生 · 仅显示 {schoolName} 的专业计划
          </p>
          <EnrollmentPlanTable
            plans={plans}
            loading={loading}
            error={error}
            emptyText="该校暂无招生计划数据"
            onAdd={onAdd}
            showAddButton={Boolean(onAdd)}
          />
        </>
      )}
    </div>
  );
}
