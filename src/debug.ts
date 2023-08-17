import { config } from './config';

export const debugLog = (str: unknown) => {
  if (config.ENABLED_DEBUGGING) console.log(str);
};