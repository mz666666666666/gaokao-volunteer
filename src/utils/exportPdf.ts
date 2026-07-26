import { GAOKAO_DATA_YEAR } from "../constants/gaokao";
import type { StudentProfile, University, VolunteerItem } from "../types";

interface ExportVolunteerPdfOptions {
  profile: StudentProfile;
  volunteers: VolunteerItem[];
  findUniversity: (id: string) => University | undefined;
}

function buildVolunteerDocument(
  profile: StudentProfile,
  volunteers: VolunteerItem[],
  findUniversity: (id: string) => University | undefined,
): string {
  const rows = volunteers
    .map((item) => {
      const university = findUniversity(item.universityId);
      const schoolName = university?.name ?? item.universityId;
      const location = university
        ? `${university.province} · ${university.city}`
        : "—";
      return `
        <tr>
          <td>${item.order}</td>
          <td>${schoolName}</td>
          <td>${item.major}</td>
          <td>${item.risk}</td>
          <td>${location}</td>
          <td>${item.enrollmentNumbers ?? "—"}</td>
        </tr>
      `;
    })
    .join("");

  const title = profile.name.trim() ? `${profile.name} 的高考志愿表` : "高考志愿表";
  const dateText = new Date().toLocaleString("zh-CN");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
      color: #1a1a2e;
      margin: 0;
      padding: 32px;
    }
    h1 { margin: 0 0 8px; font-size: 24px; text-align: center; }
    .meta { margin: 0 0 24px; text-align: center; color: #666; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { padding: 10px 8px; border: 1px solid #ddd; text-align: left; }
    th { background: #f0f4ff; text-align: center; }
    td:first-child, td:nth-child(4), td:last-child { text-align: center; }
    .footer { margin-top: 24px; font-size: 12px; color: #888; }
    @media print {
      body { padding: 16px; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">
    ${GAOKAO_DATA_YEAR} 年 · ${profile.province} · ${profile.subjectType} · ${profile.score} 分 · 位次 ${profile.rank}
  </p>
  <table>
    <thead>
      <tr>
        <th>序号</th>
        <th>院校</th>
        <th>专业</th>
        <th>策略</th>
        <th>所在地</th>
        <th>招生人数</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">导出时间：${dateText}</p>
  <p class="footer">本表仅供参考，填报请以各省考试院及院校官方发布为准。</p>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;
}

/** 打开打印预览，用户可选择「另存为 PDF」保存志愿表 */
export async function exportVolunteerPdf({
  profile,
  volunteers,
  findUniversity,
}: ExportVolunteerPdfOptions): Promise<void> {
  if (volunteers.length === 0) {
    throw new Error("志愿表为空，无法导出");
  }

  const html = buildVolunteerDocument(profile, volunteers, findUniversity);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (!printWindow) {
    URL.revokeObjectURL(url);
    throw new Error("浏览器拦截了弹窗，请允许弹窗后重试");
  }

  printWindow.addEventListener("load", () => {
    URL.revokeObjectURL(url);
  });
}
