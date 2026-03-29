const appConfig = {
  name: 'Fithub',
  description: 'AI-powered communication bridge between Product Managers and Developers',
  env: {
    geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY ?? import.meta.env.GEMINI_API_KEY ?? '',
    appUrl: import.meta.env.VITE_APP_URL ?? import.meta.env.APP_URL ?? '',
  },
} as const;

export type AppConfig = typeof appConfig;

export default appConfig;
