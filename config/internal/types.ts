export type NodeEnvValues = 'production' | 'development' | 'staging'

export type AppConfig = {
  NODE_ENV: NodeEnvValues;
} & RequiredUserConfig

export interface RequiredUserConfig {
  /** Should we perform debug logging - this will slow down performance by a bit */
  ENABLED_DEBUGGING?: boolean;
  /** GENERATE A STRONG (min 128 characters) API Key - used to authenticate (allow access) */
  API_KEY: string;
  /** File configuration to allow remote access to files */
  REMOTE_FILES: RemoteFileAccess[];
  REMOTE_DIRECTORIES: RemoteDirectoryAccess[];
  /** JSON database configuration, allows remote management of local JSON data */
  REMOTE_JSON_DATABASES: JsonDatabase[];
  /**
   * Which port this application should run on, between `0` and `65535`
   * 
   * Note: Port range `[0-1024]` should be considered reserved as they're well-known ports,
   * these require SuperUser/Administrator access
   * 
   * Note: Port range `[49152-65535]` should be considered reserved for Ephemeral Ports
   * (Unix based devices, configurable)
   * 
   * Reference: {@link https://www.ncftp.com/ncftpd/doc/misc/ephemeral_ports.html}
   */
  PORT: number;
}

export type UserConfig = Partial<AppConfig> & RequiredUserConfig

export interface RemoteFileAccess {
  /** The name for this remote access content, should be unique */
  NAME: string;
  /**
   * The absolute path to the directory that holds the content.
   * Escape paths on Windows: `C:\\Users\\OmegaManager\\servers\\0\\profiles`
   */
  DIRECTORY: string;
  /**
   * The file to look for, with extension
   * 
   * - If omitted, latest created file from DIRECTORY will be used
   * - If provided, only allows access to file with exact name match
   */
  FILE_NAME?: string;
  /**
   * The amount of lines to include in the response
   * 
   * - Disabled by default, entire file will be included in response
   * - Useful to restrict data transfer for huge (log) files
   */
  USE_LATEST_LINES?: number | null;
  /** The file extension to look for
   * 
   * - Ignored when `FILE_NAME` is provided
   * - Only allows files of provided extension when looking for most recent file otherwise
   */
  EXTENSION?: string | null;
  /**
   * Should the response be an array of split lines, or the raw file output
   * @default true
   */
  SPLIT?: boolean;
  /**
   * The amount of files to include in the response
   * 
   * - 1 by default, only latest file match will be used
   * - Useful if you have small log files, and want to include
   * a bit more in your working data
   */
  USE_LATEST_FILES?: number | null;
  /**
   * If {@link USE_LATEST_FILES} is used, and higher than 1, should the
   * multiple files be concatenated into 1 array response, or - when `false` -
   * return an array for every file entry
   * @default true
   */
  JOIN_LATEST_FILES?: boolean;
}

export interface RemoteDirectoryAccess {
  /** The name for this remote access content, should be unique */
  NAME: string;
  /**
   * The absolute path to the directory that should be accessed remotely.
   * Escape paths on Windows: `C:\\Users\\OmegaManager\\servers\\0\\profiles`
   */
  DIRECTORY: string;
  /** Whitelisted file extensions - everything is whitelisted if empty or null */
  EXTENSIONS?: string[] | null;
}

export interface JsonDatabase {
  /** The name for this remote json database, should be unique */
  NAME: string;
  /**
   * The absolute path to the directory that holds the content.
   * Escape paths on Windows: `C:\\Users\\OmegaManager\\servers\\0\\profiles`
   */
  DIRECTORY: string;
}
