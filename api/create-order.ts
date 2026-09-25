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
    // Parse body if received as string or Buffer
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
        error: 'Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.'
      });
    }

    const { amount, currency = 'INR', receipt, notes } = body || {};

    // Validate minimum amount: 100 paise (₹1.00)
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount < 100) {
      return res.status(400).json({
        error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).'
      });
    }

    const authHeader = 'Basic ' + Buffer.from(`${key_id}:${key_secret}`).toString('base64');

    const orderPayload = {
      amount: Math.round(numericAmount),
      currency: currency || 'INR',
      receipt: receipt || `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      notes: notes || {}
    };

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    });

    const responseData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error('Razorpay API error response:', responseData);
      if (rzpResponse.status === 401) {
        return res.status(401).json({
          error: 'Razorpay authentication failed. Verify Key ID and Secret.',
          details: responseData
        });
      }
      return res.status(rzpResponse.status || 500).json({
        error: responseData.error?.description || 'Failed to create payment order with Razorpay',
        details: responseData
      });
    }

    return res.status(200).json({
      order_id: responseData.id,
      amount: responseData.amount,
      currency: responseData.currency,
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
