/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIETICIAN_EMAIL?: string;
  readonly VITE_DIETICIAN_PASSWORD?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
