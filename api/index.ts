import 'dotenv/config';
import express from 'express';
import { apiRouter } from '../src/server/api.ts';

const app = express();

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

app.use(express.json());

// Support both /api prefix and root for Vercel serverless rewrites
app.get(['/', '/api'], (_req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Tabletop Player Sheet Manager API',
    version: '1.0.0',
    endpoints: {
      characters: '/api/characters',
      search: '/api/characters/search?q={query}',
      spells: '/api/spells',
      health: '/api/health'
    }
  });
});

app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
