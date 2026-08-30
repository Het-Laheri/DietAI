import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface MetaWhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  verifyToken: string;
  appSecret?: string;
  apiVersion: string;
}

export function getWhatsAppConfig(): MetaWhatsAppConfig {
  return {
    accessToken: process.env.META_WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '',
    businessAccountId: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '',
    verifyToken: process.env.META_WHATSAPP_VERIFY_TOKEN || 'nutrisnap_whatsapp_token',
    appSecret: process.env.META_WHATSAPP_APP_SECRET || '',
    apiVersion: process.env.META_WHATSAPP_API_VERSION || 'v21.0',
  };
}

/**
 * Normalizes phone numbers to standard E.164 digits without '+' or formatting.
 * E.g. "+91 98765 43210" -> "919876543210"
 * E.g. "9876543210" (10 digits) -> "919876543210" (assumes India +91 default if 10 digits)
 */
export function normalizeWhatsAppNumber(rawNumber: string): string {
  let cleaned = (rawNumber || '').replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned; // Default country code if 10 digits
  }
  return cleaned;
}

/**
 * Verifies X-Hub-Signature-256 header sent by Meta Webhooks
 */
export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!appSecret || !signatureHeader) return true; // Skip if app secret not configured in dev
  try {
    const signature = signatureHeader.replace('sha256=', '');
    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch (e) {
    console.error('Signature verification error:', e);
    return false;
  }
}

/**
 * Sends a plain text WhatsApp message via Meta WhatsApp Cloud API
 */
export async function sendTextMessage(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: 'Meta WhatsApp credentials (access token or phone number ID) are not configured.' };
  }

  const cleanPhone = normalizeWhatsAppNumber(to);
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { preview_url: false, body },
      }),
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.error('Meta API Error:', data);
      return { success: false, error: data.error?.message || 'Meta API returned error' };
    }
  } catch (err: any) {
    console.error('Failed to send WhatsApp text message:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a pre-approved template message (required for business-initiated chats outside 24h window)
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode: string = 'en_US',
  components: any[] = []
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: 'Meta WhatsApp credentials are not configured.' };
  }

  const cleanPhone = normalizeWhatsAppNumber(to);
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.error('Meta Template API Error:', data);
      return { success: false, error: data.error?.message || 'Failed to send template message' };
    }
  } catch (err: any) {
    console.error('Template send error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an image message via Meta WhatsApp Cloud API
 */
export async function sendImageMessage(
  to: string,
  imageUrl: string,
  caption?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config.accessToken || !config.phoneNumberId) {
    return { success: false, error: 'Meta WhatsApp credentials not configured.' };
  }

  const cleanPhone = normalizeWhatsAppNumber(to);
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption || '',
        },
      }),
    });

    const data = await res.json();
    if (res.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    } else {
      return { success: false, error: data.error?.message || 'Failed to send image' };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Downloads incoming media (food photos, voice notes, documents) from Meta Cloud API
 */
export async function downloadMedia(mediaId: string): Promise<{ localPath?: string; mimeType?: string; error?: string }> {
  const config = getWhatsAppConfig();
  if (!config.accessToken) {
    return { error: 'Access token missing' };
  }

  try {
    // Step 1: Get media URL from Meta
    const metaUrl = `https://graph.facebook.com/${config.apiVersion}/${mediaId}`;
    const metaRes = await fetch(metaUrl, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });
    const metaData = await metaRes.json();

    if (!metaRes.ok || !metaData.url) {
      return { error: metaData.error?.message || 'Failed to fetch media metadata' };
    }

    // Step 2: Download binary stream
    const binaryRes = await fetch(metaData.url, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });

    if (!binaryRes.ok) {
      return { error: 'Failed to download media binary' };
    }

    const arrayBuffer = await binaryRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to local storage directory
    const mediaDir = path.join(process.cwd(), 'whatsapp_media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }

    const ext = (metaData.mime_type || 'image/jpeg').split('/')[1] || 'jpg';
    const filename = `${mediaId}_${Date.now()}.${ext}`;
    const filePath = path.join(mediaDir, filename);

    fs.writeFileSync(filePath, buffer);

    return {
      localPath: `/whatsapp_media/${filename}`,
      mimeType: metaData.mime_type,
    };
  } catch (err: any) {
    console.error('Media download error:', err);
    return { error: err.message };
  }
}

/**
 * Diagnostic health check for Meta WhatsApp Cloud API configuration
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  configured: boolean;
  phoneNumberId?: string;
  apiVersion?: string;
  error?: string;
}> {
  const config = getWhatsAppConfig();
  const configured = Boolean(config.accessToken && config.phoneNumberId);

  if (!configured) {
    return {
      connected: false,
      configured: false,
      error: 'Missing META_WHATSAPP_ACCESS_TOKEN or META_WHATSAPP_PHONE_NUMBER_ID',
    };
  }

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${config.accessToken}` },
    });
    const data = await res.json();

    if (res.ok && data.id) {
      return {
        connected: true,
        configured: true,
        phoneNumberId: config.phoneNumberId,
        apiVersion: config.apiVersion,
      };
    } else {
      return {
        connected: false,
        configured: true,
        error: data.error?.message || 'Meta API returned authentication or scope error',
      };
    }
  } catch (err: any) {
    return {
      connected: false,
      configured: true,
      error: err.message,
    };
  }
}
