import fs from 'fs';
import yaml from 'js-yaml';
import { Logger } from '../logger';
import Magic from '../magic';
import { configSchema } from './schema';

type NodeEnvValues = 'production' | 'development' | 'staging'

const config = configSchema.parse(yaml.load(fs.readFileSync('config.yaml', 'utf8')));

/**
 * Resolve a type-safe version of NODE_ENV
 */
export const resolveNodeEnv = (localValue = process.env.NODE_ENV): NodeEnvValues => (
  typeof localValue === 'undefined' || localValue === 'production'
    ? 'production'
    : localValue === 'staging'
      ? 'staging'
      : 'development'
);

/**
 * Resolve our app configuration: user-provided config + defaults
 */
export const resolveAppConfig = () => {
  const nodeEnv = resolveNodeEnv();
  const merged = {
    NODE_ENV: nodeEnv,
    ...config,
  };

  process.env.NODE_ENV = nodeEnv;

  return merged;
};

/**
 * An object that represent our local/runtime configuration - singleton
 */
export const appConfig = resolveAppConfig();

/**
 * Validates the resolved `appConfig`, warning users when
 * necessary, and existing if we can't operate due to bad configuration
 */
export const validateConfig = () => {
  // Warn insecure api key
  if ((appConfig['master-api-key']?.length ?? 0) < Magic.RECOMMENDED_API_KEY_LENGTH) {
    Logger.warn([
      '[Configuration] "api-key" should be at least 128 characters.',
      '  ↳ This security measure is in place to protect your information/privacy',
    ].join('\n'));
  }

  // Make sure we have a valid port
  if (
    typeof appConfig.port !== 'number'
    || appConfig.port < 0
    || appConfig.port > Magic.VALID_PORT_RANGE_MAX
  ) {
    Logger.error(`[Configuration] "port" is not in range 0-${Magic.VALID_PORT_RANGE_MAX}`);
    process.exit(1);
  }

  // After validating port, warn about reserved well-known ports
  if (appConfig.port <= Magic.WELL_KNOWN_PORT_RANGE) {
    Logger.warn(`[Configuration] "port" is in the reserved well-known ports range of 0-${Magic.WELL_KNOWN_PORT_RANGE}`);
  }

  // After validating port, warn about reserved Ephemeral Ports
  if (appConfig.port >= Magic.EPHEMERAL_PORT_RANGE_START) {
    Logger.warn(`[Configuration] "port" is in the reserved Ephemeral Port range of 0-${Magic.WELL_KNOWN_PORT_RANGE}`);
  }
};

export default appConfig;
