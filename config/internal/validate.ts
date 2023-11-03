import { stripIndents } from 'common-tags';
import { mergedConfig } from './internal-config';
import {
  EPHEMERAL_PORT_RANGE_START,
  RECOMMENDED_API_KEY_LENGTH,
  VALID_PORT_RANGE_MAX,
  WELL_KNOWN_PORT_RANGE
} from '../../src/magic';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Validates the resolved `mergedConfig`, warning users when
 * necessary, and existing if we can't operate due to bad configuration
 */
export const validateConfig = () => {
  // Warn insecure api key
  if ((mergedConfig.API_KEY?.length ?? 0) < RECOMMENDED_API_KEY_LENGTH) {
    console.warn([
      '[Configuration] "API_KEY" should be at least 128 characters.',
      '  ↳ This security measure is in place to protect your information/privacy'
    ].join('\n'));
  }

  // Exit if there's nothing to do/no files to serve
  // if ((mergedConfig.REMOTE_FILES?.length ?? 0) < 1) {
  //   console.error([
  //     '[Configuration] "REMOTE_FILES" should have at least 1 element',
  //     '  ↳ Exiting as there\'s nothing to do/no files to serve...'
  //   ].join('\n'));
  //   process.exit(1);
  // }

  // Make sure we have a workable port
  if (
    typeof mergedConfig.PORT !== 'number'
    || mergedConfig.PORT < 0
    || mergedConfig.PORT > VALID_PORT_RANGE_MAX
  ) {
    console.error(stripIndents`
      [Configuration] "PORT" is not in range 0-${VALID_PORT_RANGE_MAX}
    `);
    process.exit(1);
  }

  // After validating port, warn about reserved well-known ports
  if (mergedConfig.PORT <= WELL_KNOWN_PORT_RANGE) {
    console.warn(stripIndents`
      [Configuration] "PORT" is in the reserved well-known ports range of 0-${WELL_KNOWN_PORT_RANGE}
    `);
  }

  // After validating port, warn about reserved Ephemeral Ports
  if (mergedConfig.PORT >= EPHEMERAL_PORT_RANGE_START) {
    console.warn(stripIndents`
      [Configuration] "PORT" is in the reserved Ephemeral Port range of 0-${WELL_KNOWN_PORT_RANGE}
    `);
  }

  // Validate all our remote file access configs
  for (const rfCfg of mergedConfig.REMOTE_FILES) {
    const normalizedPath = path.normalize(rfCfg.DIRECTORY);

    // Always required valid DIRECTORY
    if (!existsSync(normalizedPath)) {
      console.error(stripIndents`
        [Configuration - REMOTE_FILES] "DIRECTORY" path does not exist (${rfCfg.DIRECTORY})
      `);
      process.exit(1);
    }

    // Required valid file name if provided
    if (rfCfg.FILE_NAME) {
      const filePath = path.normalize(`${normalizedPath}/${rfCfg.FILE_NAME}`);
      if (!existsSync(filePath)) {
        console.error(stripIndents`
          [Configuration - REMOTE_FILES] "FILE_NAME" path does not exist (${filePath})
        `);
        process.exit(1);
      }
    }
  }

  // Validate all our remote directory access configs
  for (const rdCfg of mergedConfig.REMOTE_DIRECTORIES) {
    const normalizedPath = path.normalize(rdCfg.DIRECTORY);

    // Always required valid DIRECTORY
    if (!existsSync(normalizedPath)) {
      console.error(stripIndents`
        [Configuration - REMOTE_DIRECTORIES] "DIRECTORY" path does not exist (${rdCfg.DIRECTORY})
      `);
      process.exit(1);
    }
  }

  // Validate all JSON database configs
  for (const jsonDbCfg of mergedConfig.REMOTE_JSON_DATABASES) {
    const normalizedPath = path.normalize(jsonDbCfg.DIRECTORY);
  
    // Always required valid DIRECTORY
    if (!existsSync(normalizedPath)) {
      console.error(stripIndents`
          [Configuration - REMOTE_JSON_DATABASES] "DIRECTORY" path does not exist (${jsonDbCfg.DIRECTORY})
        `);
      process.exit(1);
    }
  }
};
