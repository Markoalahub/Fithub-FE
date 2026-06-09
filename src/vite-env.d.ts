/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BE_BASE_URL?: string;
  readonly VITE_BE_API_BASE_URL?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly VITE_APP_URL?: string;
  readonly GEMINI_API_KEY?: string;
  readonly APP_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
