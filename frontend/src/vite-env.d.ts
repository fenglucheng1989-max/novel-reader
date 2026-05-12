/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_APP_API_BASE_URL?: string
  readonly VITE_API_TARGET?: string
  readonly DEV?: boolean
  readonly PROD?: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
