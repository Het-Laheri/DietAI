import app from '../server';

export default function handler(req: any, res: any) {
  const expressApp = (app as any)?.default || app;
  if (typeof expressApp === 'function') {
    return expressApp(req, res);
  }
  return res.status(500).json({ error: 'Express app initialization error' });
}
