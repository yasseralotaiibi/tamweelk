import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import apiRateLimiter from './middleware/rateLimit';
import cibaRouter from './auth/cibaRouter';
import consentRouter from './consents/consentRouter';
import logger from './config/logger';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);
app.use(express.static(path.join(__dirname, '..', 'public')));

const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiDocument = YAML.parse(fs.readFileSync(openApiPath, 'utf8'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', cibaRouter);
app.use('/api', consentRouter);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('app:unhandled_error', { message: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
