/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_API_URL?: string;
}

// Injected from package.json by vite.config.ts
declare const __APP_VERSION__: string;
