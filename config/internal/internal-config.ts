import userConfig from '../config';
import { AppConfig, NodeEnvValues, UserConfig } from './types';

/**
 * Resolve our active NODE_ENV, which can be overwritten in local user config
 */
export const resolveNodeEnvironment = (localValue?: string): NodeEnvValues => (
  typeof localValue === 'undefined' || localValue === 'production'
    ? 'production'
    : localValue === 'staging'
      ? 'staging'
      : 'development'
);

/**
 * Resolve our app configuration, which is user provided
 * config merged with app defaults and whitelisted values
 */
export const appConfig = (userConfig: UserConfig): AppConfig => {
  // Resolve our config
  const nodeEnv = resolveNodeEnvironment(userConfig.NODE_ENV);
  const config = {
    // Only allow whitelisted values for NODE_ENV
    NODE_ENV: nodeEnv,
    ...userConfig
  };

  // Force persistency in dotenv, overwritten by userConfig
  process.env.NODE_ENV = nodeEnv;

  return config;
};

/**
 * An object that represent our local/runtime configuration - singleton
 */
export const mergedConfig: AppConfig = {
  ...appConfig(userConfig),
};

export default appConfig;