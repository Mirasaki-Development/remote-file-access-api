// export { mergedConfig as config } from '../config/internal/internal-config';

import { mergedConfig } from '../config/internal/internal-config';
export const config = mergedConfig;
export default config;

export const remoteFileOptions = config.REMOTE_FILES.map((rf) => rf.NAME);
