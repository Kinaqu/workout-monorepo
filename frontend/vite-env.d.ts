/// <reference types="vite/client" />

declare module '*.bones.json' {
  const bones: unknown;
  export default bones;
}

declare module 'boneyard-js' {
  export function registerBones(map: Record<string, unknown>): void;
}

declare module 'boneyard-js/react' {
  export function registerBones(map: Record<string, unknown>): void;
}

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_BASE_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  __APP_CONFIG__?: {
    apiBaseUrl?: string;
  };
  Clerk?: {
    session?: unknown;
    isSignedIn?: boolean;
  };
}
