import fs from 'fs';
import path from 'path';
import pino from 'pino';
import appConfig from './resources/config';

const isProd = process.env.NODE_ENV === 'production';
const logDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logDir, 'app.log');

if (isProd && !fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = isProd
  ? fs.createWriteStream(logFile, { flags: 'a' })
  : undefined;

export const logger = pino({
  level: appConfig['log-level'],
  redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["x-api-key"]'],
  transport: isProd
    ? undefined
    : {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
}, logStream);
