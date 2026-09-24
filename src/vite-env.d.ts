/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIETICIAN_EMAIL?: string;
  readonly VITE_DIETICIAN_PASSWORD?: string;
  readonly VITE_RAZORPAY_KEY_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  Razorpay: any;
}
