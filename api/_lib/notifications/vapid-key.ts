import { applyCors } from '../security.js';
import { getOrCreateVapidKeys } from '../webPush.js';

export default async function handler(req: any, res: any) {
  if (applyCors(req, res, ['GET'])) return;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const keys = await getOrCreateVapidKeys();
    res.status(200).json({
      publicKey: keys.publicKey,
      subject: keys.subject,
    });
  } catch (err: any) {
    console.error('[api/notifications/vapid-key] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve VAPID public key.' });
  }
}
