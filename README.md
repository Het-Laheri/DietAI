# NutriSnap — AI Clinical Dietician Portal & Meta WhatsApp Cloud API

NutriSnap is a full-stack dietician-patient management web application built with React, Vite, TypeScript, Express, Firebase Firestore, Google Gemini 2.5 Pro AI, and direct integration with the **Official Meta WhatsApp Cloud API**.

---

## 🌟 Key Features

1. **Dietician Clinical Portal**: Patient dossiers, AI meal plan generator (RAG powered by custom Excel recipe knowledge base), biometrics progress tracking, notification center.
2. **Meta WhatsApp Cloud API Integration**: Direct two-way messaging between patients and dieticians via WhatsApp without third-party BSP fees.
   - **Incoming Webhooks**: Receives incoming patient text messages, food photographs, voice notes, and documents.
   - **Patient Matching**: Automatically maps incoming WhatsApp numbers to registered patient profiles in Firestore. Unrecognized numbers are flagged safely for manual association.
   - **AI Draft Suggestions**: Generates patient-contextualized clinical reply suggestions using Gemini 2.5 Pro for dietician review.
   - **Non-Medical Auto-Receipt**: Immediately acknowledges patient queries operationally while routing to the dietician inbox.
   - **Meta Approved Templates**: Supports sending proactive template messages outside the 24-hour customer service window.
3. **Patient Mobile Portal**: Today's meal plan, food scanner, biometrics log (weight/water), and in-app/WhatsApp messaging.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS v4, Lucide Icons, React Router v7
- **Backend API**: Express (Node.js), SheetJS (`xlsx`)
- **Database & Auth**: Firebase Auth, Cloud Firestore (Realtime snapshot listeners)
- **AI Services**: Google Gemini 2.5 Pro (`@google/genai`)
- **WhatsApp Integration**: Official Meta WhatsApp Cloud API (Graph API `v21.0`)

---

## 📋 Environment Variables Setup

Copy `.env.example` to `.env` and fill in your credentials:

```env
# Google Gemini AI API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# Application Host URL
APP_URL="http://localhost:3000"

# ─── META WHATSAPP CLOUD API CONFIGURATION ──────────────────
# 1. Create a Meta App at https://developers.facebook.com
# 2. Add the "WhatsApp" product to your Meta App
# 3. Copy Access Token, Phone Number ID, and App Secret below:

META_WHATSAPP_ACCESS_TOKEN="YOUR_META_PERMANENT_OR_TEMP_ACCESS_TOKEN"
META_WHATSAPP_PHONE_NUMBER_ID="YOUR_META_PHONE_NUMBER_ID"
META_WHATSAPP_BUSINESS_ACCOUNT_ID="YOUR_META_BUSINESS_ACCOUNT_ID"
META_WHATSAPP_VERIFY_TOKEN="nutrisnap_whatsapp_token"
META_WHATSAPP_APP_SECRET="YOUR_META_APP_SECRET"
META_WHATSAPP_API_VERSION="v21.0"
```

---

## 🚀 Setting Up Meta WhatsApp Webhook for Local Development

Meta Cloud API requires a publicly accessible HTTPS endpoint to send incoming message webhooks.

### Step 1: Start NutriSnap Local Server
```bash
npm run dev
# Server starts at http://localhost:3000
```

### Step 2: Start a Tunnel (Cloudflare Tunnel or ngrok)

Using **ngrok**:
```bash
ngrok http 3000
```
OR using **Cloudflare Tunnel**:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

Copy the generated HTTPS URL (e.g. `https://xxxx.ngrok-free.app` or `https://xxxx.trycloudflare.com`).

### Step 3: Configure Meta Developer Console

1. Go to [Meta for Developers](https://developers.facebook.com) → **My Apps** → Select your App.
2. Under **WhatsApp** → **Configuration**:
   - **Callback URL**: `https://YOUR_TUNNEL_URL/api/whatsapp/webhook`
   - **Verify Token**: `nutrisnap_whatsapp_token` (matches `META_WHATSAPP_VERIFY_TOKEN` in your `.env`)
3. Click **Verify and Save**.
4. Under **Webhook Fields**, subscribe to **`messages`**.

---

## 📲 Testing WhatsApp Flow End-to-End

1. Add your personal WhatsApp number to a test patient in NutriSnap under **Dietician Portal → Patients → Add Patient** or edit existing profile.
2. From your personal WhatsApp, send a message to your Meta WhatsApp Test/Business Number:
   > *"Hi Doctor, can I eat mango today?"*
3. NutriSnap receives the Meta webhook:
   - Matches your number to the patient profile.
   - Saves message to Firestore (`whatsapp_messages`).
   - Sends an instant operational acknowledgment to WhatsApp:
     > *"Hello [Name]! Your message has been received by NutriSnap. Your dietician will review and reply shortly."*
   - Generates an AI suggested reply using patient clinical context.
   - Alerts the dietician dashboard via the top notification bell.
4. Open **Dietician Dashboard → WhatsApp**:
   - View the active thread.
   - Click **AI Auto-Draft Reply** to inspect or edit the AI draft.
   - Click **Send WhatsApp** to dispatch the response via Meta Graph API v21.0.
5. Check your personal WhatsApp — the dietician reply arrives instantly!

---

## 🔒 Security & Privacy Architecture

- **Backend Isolation**: Meta API access tokens (`META_WHATSAPP_ACCESS_TOKEN`) and secrets are strictly retained on the backend and never exposed to the client browser.
- **Webhook Signature Validation**: Inbound POST requests can be verified against `META_WHATSAPP_APP_SECRET` using HMAC-SHA256 signature checking.
- **Deduplication**: Inbound messages are deduplicated using Meta's unique `whatsappMessageId`.
- **Media Security**: Downloaded food photographs are stored in a protected local directory (`whatsapp_media/`) and served securely.

---

## 📄 License & Credits
Built for clinical dietician practice automation. Powered by Google DeepMind Gemini & Meta WhatsApp Cloud API.
