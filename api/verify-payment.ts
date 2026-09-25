import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'hLGoXT0tsAHstxufVieSXqCN';

    if (!key_secret) {
      return res.status(401).json({
        success: false,
        error: 'Razorpay Key Secret is not configured on the server'
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required'
      });
    }

    // HMAC-SHA256 signature verification: order_id + "|" + payment_id
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      console.warn('Payment signature verification mismatch. Generated vs Received:', {
        expectedSignature,
        razorpay_signature
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error: any) {
    console.error('Razorpay verify-payment API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while verifying payment',
      details: error?.message || error
    });
  }
}
