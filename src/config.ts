// export { mergedConfig as config } from '../config/internal/internal-config';

import { mergedConfig } from '../config/internal/internal-config';
import { debugLog } from './debug';
export const config = mergedConfig;
export default config;

export const remoteFileOptions = config.REMOTE_FILES.map((rf) => `/files/${rf.NAME}`);
debugLog('Remote file options:', remoteFileOptions);

export const remoteDirectoryOptions = config.REMOTE_DIRECTORIES.map((rd) => `/directories/${rd.NAME}`);
debugLog('Remote directory options:', remoteDirectoryOptions);

export const remoteDBOptions = config.REMOTE_JSON_DATABASES.map((jdb) => `/json/${jdb.NAME}`);
debugLog('Remote JSON database options:', remoteDBOptions);

export const allRouteOptions = [
  ...remoteFileOptions,
  ...remoteDirectoryOptions,
  ...remoteDBOptions
];
