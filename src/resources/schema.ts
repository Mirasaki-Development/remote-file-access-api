import crypto from 'crypto';
import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slugErrorMessage = 'Slug must be lowercase, alphanumeric and can only contain dashes (-)';
const slug = z.string().regex(slugRegex, slugErrorMessage).min(1).max(64);

const generateApiKey = (
  format: 'hex' | 'base64' = 'hex',
  length = 32,
): string => {
  if (length < 32) {
    throw new Error('API key length should be at least 32 bytes.');
  }

  return crypto.randomBytes(length).toString(format);
};

const preventDefaultApiKey = (val: string): boolean => {
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  return val !== '__REPLACE_WITH_A_STRONG_API_KEY__';
};
const defaultApiKeyMessage = `You haven't changed the default API key. Please change it to a strong password-like value, like ${generateApiKey('hex', 32)}`;

const responseTypes = [
  'stream',
  'json',
  'xml',
  'html',
  'text',
  'csv',
  'yaml',
  'toml',
] as const;

type ResponseType = typeof responseTypes[number];

// [DEV] Implement size policy
const sizePolicySchema = z.object({
  'max-lines': z.number().optional(),
  'per-file': z.number().optional(),
  'max-bytes': z.number().optional(),
}).strict();

export const cacheControlPolicySchema = z.object({
  /**
   * Number of seconds the resource is considered fresh for browsers and clients.
   * @example 3600 // 1 hour
   */
  'max-age': z.number().int().positive().optional(),

  /**
   * Number of seconds the resource is fresh for shared caches (like CDNs).
   * Overrides 'max-age' for shared caches.
   * @example 7200 // 2 hours
   */
  's-maxage': z.number().int().positive().optional(),

  /**
   * Forces caches to validate the response with the server before reuse.
   * @default false
   */
  'no-cache': z.boolean().optional(),

  /**
   * Prevents the response from being cached or stored by any cache.
   * @default false
   */
  'no-store': z.boolean().optional(),

  /**
   * Indicates how long (in seconds) a stale resource can be served 
   * **while** revalidation happens in the background.
   * This helps improve perceived performance by avoiding blocking on revalidation.
   * 
   * @example 86400 // Allow serving stale responses for 1 day during background revalidation
   */
  'stale-while-revalidate': z.number().int().positive().optional(),

  /**
   * Indicates how long (in seconds) a stale resource can be served 
   * **if an error occurs** when attempting to revalidate (e.g., network/server issues).
   * This provides resilience by allowing clients/CDNs to fall back to stale content.
   * 
   * @example 604800 // Allow serving stale responses for 1 week if the origin server errors
   */
  'stale-if-error': z.number().int().positive().optional(),

  /**
   * Allows caching by any cache (browser or CDN).
   * Useful for public resources.
   * @default false
   */
  public: z.boolean().optional(),

  /**
   * Allows caching only by the browser, not by shared caches like CDNs.
   * @default false
   */
  private: z.boolean().optional(),

  /**
   * Indicates that the resource will not be updated during its freshness lifetime.
   * Clients can skip revalidation.
   * @default false
   */
  immutable: z.boolean().optional(),
}).strict();

const permissionsSchema = z.object({
  /**
   * The type of permission to apply to the resource.
   * - `read` - The resource is readable by the client
   * - `write` - The resource is writable by the client
   * - `delete` - The resource is deletable by the client
   * - `execute` - The resource is executable by the client
   * - `all` - The client can perform all actions on the resource
   */
  type: z.enum([
    'read',
    'write',
    'delete',
    'execute',
  ])
    .or(z.array(z.enum([
      'read',
      'write',
      'delete',
      'execute',
    ])))
    .or(z.literal('all')),
  /**
   * The API key that is allowed to access this resource, with the specified permission type.
   */
  'api-key': z.string().min(32).max(256).refine(preventDefaultApiKey, { message: defaultApiKeyMessage }),
});

const resourceSchema = z.object({
  /**
   * The unique identifier for this resource.
   * @example "finance-spreadsheet"
   */
  slug,
  /**
   * The absolute path to the resource (file or directory that holds the content).
   *
   * - If the resource is a file, you can either include the file extension here, or provide it in the
   * `extensions` array.
   *
   * Note: Paths should be escaped on Windows, like so: `C:\\Users\\OmegaManager\\servers\\0\\profiles`
   */
  target: z.string().min(1),
  /**
   * List of allowed file extensions for this resource.
   *
   * - If the resource is a directory, any file that does not have an extension in this list will be ignored.
   * - If the resource is a directory and this list is empty, all files will be included.
   * - If the resource is a file, the first file that matches `target` and has an extension in this list will be used.
   */
  extensions: z.union([z.array(z.string()), z.null()]).optional().nullable().default(null),
  /**
   * An (optional) policy that determines size constraints for the response.
   */
  'size-policy': sizePolicySchema.nullable().optional().default(null),
  /**
   * Defines HTTP caching behavior for the resource. This configuration is
   * used to generate the `Cache-Control` header, which instructs the client
   * and any intermediate caches on how to handle the resource.
   */
  'cache-control': cacheControlPolicySchema.optional().nullable().default(null),
  /**
   * Fine-grained permissions for this resource. If not specified, the resource
   * is accessible to all clients with the `master-api-key`.
   */
  permissions: z.array(permissionsSchema).optional().nullable().default(null),
});

const configSchema = z.object({
  /**
   * Strong "password-like" which allows access to **all** endpoints/resources
   *
   * Note: This is not a password, but an API key. Clients authenticate with
   * the API by sending this key in the `x-api-key` header.
   */
  'master-api-key': z.string().min(32).max(256).refine(preventDefaultApiKey, { message: defaultApiKeyMessage }),
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
   *
   * @throws {Error} If the port is already in use
   */
  port: z.number().int().min(1).max(65535),
  /**
   * The amount of information that should be logged to the console
   * - `debug` - All information
   * - `info` - Only important information, warnings and errors
   * - `warn` - Only warnings and errors
   * - `error` - Only errors
   */
  'log-level': z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  /**
   * The list fo resources that should be accessible through the API.
   *
   * A resource can be a file or a directory. If it's a directory, all files in that directory
   * will be accessible through the API. If it's a file, only that file will be accessible.
   */
  resources: z.array(resourceSchema),
});

type Config = z.infer<typeof configSchema>;

type CacheControlPolicy = z.infer<typeof cacheControlPolicySchema>;

export { CacheControlPolicy, Config, configSchema, resourceSchema, ResponseType, responseTypes };

