import express from 'express';
import { cors } from './middleware/cors.js';
import { attachUser } from './middleware/auth.js';
import { teachingHooks, flaky } from './middleware/teaching.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { sseHandler } from './ws/index.js';

import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import accountRoutes from './routes/account.js';
import adminRoutes from './routes/admin.js';
import adminOpsRoutes from './routes/admin-ops.js';
import imageRoutes from './routes/images.js';
import uploadRoutes from './routes/uploads.js';
import devRoutes from './routes/dev.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', true);

  app.use(cors);
  app.use(express.json({ limit: '2mb' }));

  // attachUser is cheap and never rejects — it only populates req.user when a
  // valid token is present. It must come before EVERY authenticated route,
  // uploads included.
  app.use(attachUser);

  // Images and uploads mount before the teaching hooks so that a global
  // ?_delay or ?_fail in the address bar does not stall or break every image
  // on the page along with the request you actually wanted to slow down.
  app.use('/api/images', imageRoutes);
  app.use('/api', uploadRoutes);

  app.use('/api', teachingHooks);

  app.get('/api/flaky', flaky);
  app.get('/api/events', sseHandler);

  app.use('/api/auth', authRoutes);
  app.use('/api', catalogRoutes);
  app.use('/api', cartRoutes);
  app.use('/api', orderRoutes);
  app.use('/api/account', accountRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/admin', adminOpsRoutes);
  app.use('/api/dev', devRoutes);

  app.get('/', (_req, res) => res.redirect('/api/dev/health'));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
