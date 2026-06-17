/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_AUTHORING_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
