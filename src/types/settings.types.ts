export type ThemeMode = 'system' | 'dark' | 'light';

export interface AppSettings {
  biometricEnabled: boolean;
  /** Seconds of inactivity before re-lock. 0 = never. */
  inactivityTimeoutSeconds: number;
  themeMode: ThemeMode;
}

export const DEFAULT_SETTINGS: AppSettings = {
  biometricEnabled: false,
  inactivityTimeoutSeconds: 120,
  themeMode: 'system',
};

export const INACTIVITY_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Never', value: 0 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '2 minutes', value: 120 },
  { label: '5 minutes', value: 300 },
  { label: '10 minutes', value: 600 },
];
