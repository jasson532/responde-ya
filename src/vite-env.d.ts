/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV?: 'development' | 'staging' | 'production';
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_PERSISTENCE_DRIVER?: 'local' | 'http';
  readonly VITE_LOG_LEVEL?: 'debug' | 'info' | 'warn' | 'error';
  readonly VITE_REQUEST_TIMEOUT_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
