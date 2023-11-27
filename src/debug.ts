import { config } from './config';

export const debugLog = (...params: unknown[]) => {
  if (config.ENABLED_DEBUGGING) console.log(...params);
};