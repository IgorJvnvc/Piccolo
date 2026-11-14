/**
 * The ONLY module allowed to read `import.meta.env`.
 * Everything else receives configuration through this typed object.
 */
export interface AppEnv {
  readonly isDev: boolean;
  readonly isProd: boolean;
  readonly siteUrl: string;
  readonly basePath: string;
}

const siteUrl = (import.meta.env.SITE ?? 'https://piccolo.example').replace(/\/$/, '');

export const env: AppEnv = {
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  siteUrl,
  basePath: import.meta.env.BASE_URL,
};
