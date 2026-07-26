/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GUGUDATA_APPKEY?: string;
  readonly VITE_GAOKAO_YEAR?: string;
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
