import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'riyada-openbanking-api' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize({ all: false })),
    }),
  ],
});

export default logger;
