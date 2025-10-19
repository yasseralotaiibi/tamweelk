import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import consentRouter from './consents/consentRouter';
import cibaRouter from './auth/cibaRouter';
import mockRouter from './auth/mockRouter';
import kycRoutes from './routes/kycRoutes';
import riskRoutes from './routes/riskRoutes';
import creditRoutes from './routes/creditRoutes';
import approvalRoutes from './routes/approvalRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { mtlsEnforcementPlaceholder } from './middleware/mtlsPlaceholder';
import { errorHandler } from './middleware/errorHandler';
import logger from './config/logger';

const app = express();
const openApiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openApiDocument = YAML.load(openApiPath);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);
app.use(mtlsEnforcementPlaceholder);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/ciba/auth', cibaRouter);
app.use('/mock', mockRouter);
app.use('/v1/consents', consentRouter);
app.use('/v1/kyc', kycRoutes);
app.use('/v1/risk', riskRoutes);
app.use('/v1/credit', creditRoutes);
app.use('/v1/approval', approvalRoutes);
app.use('/v1/payments', paymentRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.use('/demo', express.static(path.join(__dirname, '..', 'docs', 'demo')));

app.use(errorHandler);

app.on('close', () => {
  logger.info('Shutting down application');
});

export default app;
