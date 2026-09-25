import https from 'https';

function requestRazorpayOrder(options: {
  key_id: string;
  key_secret: string;
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const auth = Buffer.from(`${options.key_id}:${options.key_secret}`).toString('base64');
    const payload = JSON.stringify({
      amount: options.amount,
      currency: options.currency || 'INR',
      receipt: options.receipt,
      notes: options.notes || {}
    });

    const req = https.request(
      {
        hostname: 'api.razorpay.com',
        port: 443,
        path: '/v1/orders',
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ statusCode: res.statusCode || 200, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode || 500, data: rawData });
          }
        });
      }
    );

    req.on('error', (err) => {
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch {}
    } else if (Buffer.isBuffer(body)) {
      try { body = JSON.parse(body.toString('utf-8')); } catch {}
    }

    const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TgHwgxTVyxnCry';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'hLGoXT0tsAHstxufVieSXqCN';

    if (!key_id || !key_secret) {
      return res.status(401).json({
        error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      });
    }

    const { amount, currency = 'INR', receipt, notes } = body || {};

    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    const response = await requestRazorpayOrder({
      key_id,
      key_secret,
      amount: Math.round(numericAmount),
      currency,
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      notes
    });

    if (response.statusCode >= 400) {
      console.error('Razorpay API error response:', response);
      if (response.statusCode === 401) {
        return res.status(401).json({
          error: 'Razorpay authentication failed. Verify Key ID and Secret.',
          details: response.data
        });
      }
      return res.status(response.statusCode).json({
        error: response.data?.error?.description || 'Failed to create payment order with Razorpay',
        details: response.data
      });
    }

    return res.status(200).json({
      order_id: response.data.id,
      amount: response.data.amount,
      currency: response.data.currency,
      key_id
    });
  } catch (error: any) {
    console.error('Razorpay create-order handler error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error creating payment order',
      details: error
    });
  }
}
