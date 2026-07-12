const express = require('express');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const postsRoutes = require('./routes/posts');
const uploadRoutes = require('./routes/upload');
const messagesRoutes = require('./routes/messages');

/**
 * Builds the Express app with just the API routes mounted. Static file
 * serving and process-level concerns (listening on a port, 404/error
 * handlers) are added separately by each entry point:
 *   - server.js   -> local development (node server.js)
 *   - api/index.js -> Vercel serverless function
 * This keeps the same route code working in both places.
 */
function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());

  app.use('/api/auth', authRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/messages', messagesRoutes);

  return app;
}

module.exports = createApp;
