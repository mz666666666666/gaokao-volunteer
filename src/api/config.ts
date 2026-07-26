/** 咕咕数据 API 配置，密钥通过 .env 注入，勿提交到 Git */
export const guguConfig = {
  /** 正式接口密钥，留空则使用 demo 演示接口 */
  appKey: import.meta.env.VITE_GUGUDATA_APPKEY ?? "",
  /** 代理前缀，开发环境由 Vite 转发到 api.gugudata.com */
  baseUrl: import.meta.env.VITE_API_BASE ?? "/api/gugudata",
  /** 默认查询录取年份 */
  defaultYear: Number(import.meta.env.VITE_GAOKAO_YEAR ?? "2026"),
  /** 是否使用演示接口（无 appkey 时自动启用） */
  useDemo: !(import.meta.env.VITE_GUGUDATA_APPKEY ?? ""),
};
