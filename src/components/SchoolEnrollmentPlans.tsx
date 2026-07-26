import { useState } from "react";
import { SchoolPlanPanel } from "./EnrollmentPlanTable";
import { useEnrollmentPlans } from "../hooks/useEnrollmentPlans";
import type { DataSourceMode, EnrollmentPlan, University } from "../types";

interface SchoolEnrollmentPlansProps {
  university: University;
  provinceName: string;
  dataSource: DataSourceMode;
  risk: "冲" | "稳" | "保";
  onAdd: (plan: EnrollmentPlan, risk: "冲" | "稳" | "保") => void;
}

export function SchoolEnrollmentPlans({
  university,
  provinceName,
  dataSource,
  risk,
  onAdd,
}: SchoolEnrollmentPlansProps) {
  const [expanded, setExpanded] = useState(false);
  const { plans, loading, error } = useEnrollmentPlans({
    provinceNames: [provinceName],
    schoolName: university.name,
    schoolUuid: university.schoolUuid,
    hotMajors: university.hotMajors,
    source: dataSource,
    enabled: expanded,
  });

  return (
    <SchoolPlanPanel
      schoolName={university.name}
      schoolUuid={university.schoolUuid}
      provinceName={provinceName}
      plans={plans}
      loading={loading}
      error={error}
      expanded={expanded}
      onToggle={() => setExpanded((value) => !value)}
      onAdd={(plan) => onAdd(plan, risk)}
    />
  );
}
