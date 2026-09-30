import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { runDatabaseSeed } from './backend/database/seed';
import { authRouter } from './backend/routes/auth';
import { schemesRouter } from './backend/routes/schemes';
import { applicationsRouter } from './backend/routes/applications';
import { documentsRouter } from './backend/routes/documents';
import { deficienciesRouter } from './backend/routes/deficiencies';
import { screeningRouter } from './backend/routes/screening';
import { selectionRouter } from './backend/routes/selection';
import { postSelectionRouter } from './backend/routes/postSelection';
import { notificationsRouter } from './backend/routes/notifications';
import { communicationsRouter } from './backend/routes/communications';
import { analyticsRouter } from './backend/routes/analytics';
import { reportsRouter } from './backend/routes/reports';
import { auditLogsRouter } from './backend/routes/auditLogs';
import { aiRouter } from './backend/routes/ai';
import { usersRouter } from './backend/routes/users';
import { demoRouter } from './backend/routes/demo';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Base express middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads directory (protected by documents router, but available if needed)
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mount REST API routes under /api
app.use('/api/auth', authRouter);
app.use('/api/schemes', schemesRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/deficiencies', deficienciesRouter);
app.use('/api/screening', screeningRouter);
app.use('/api/selection', selectionRouter);
app.use('/api/post-selection', postSelectionRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/communications', communicationsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/users', usersRouter);
app.use('/api/demo', demoRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Tribal Scholarship & Fellowship Portal (MoTA)',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  // 1. Initialize seed if empty
  await runDatabaseSeed(false);

  // 2. Setup Vite in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Tribal Scholarship Portal server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
