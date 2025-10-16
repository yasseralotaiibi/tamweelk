import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf } = format;

const jsonFormat = printf(({ level, message, timestamp: time, ...metadata }) => {
  return JSON.stringify({
    level,
    message,
    timestamp: time,
    metadata
  });
});

export const logger = createLogger({
  level: 'info',
  format: combine(timestamp(), jsonFormat),
  transports: [new transports.Console()]
});

export default logger;
