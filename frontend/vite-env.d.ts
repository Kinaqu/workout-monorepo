/// <reference types="vite/client" />

declare module '*.bones.json' {
  import type { ResponsiveBones, SkeletonResult } from 'boneyard-js';
  const bones: SkeletonResult | ResponsiveBones;
  export default bones;
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
