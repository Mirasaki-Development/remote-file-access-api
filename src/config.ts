// export { mergedConfig as config } from '../config/internal/internal-config';

import { mergedConfig } from '../config/internal/internal-config';
export const config = mergedConfig;
export default config;

export const remoteFileOptions = config.REMOTE_FILES.map((rf) => `/files/${rf.NAME}`);

export const remoteDBOptions = config.REMOTE_JSON_DATABASES.map((jdb) => `/json/${jdb.NAME}`);

export const allRouteOptions = [
  ...remoteFileOptions,
  ...remoteFileOptions
];
