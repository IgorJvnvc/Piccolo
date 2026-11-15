/**
 * The ONLY module allowed to read `import.meta.env`.
 * Everything else receives configuration through this typed object.
 */
export interface AppEnv {
  readonly siteUrl: string;
}

export const env: AppEnv = {
  siteUrl: (import.meta.env.SITE ?? 'https://piccolo.example').replace(/\/$/, ''),
};
