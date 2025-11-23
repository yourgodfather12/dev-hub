/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_HF_API_KEY?: string;
  readonly VITE_HF_API_URL?: string;
  readonly VITE_API_EXPLORER_TOKEN?: string;
  readonly VITE_ADMIN_TOKEN?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}
