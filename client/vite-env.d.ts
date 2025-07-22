/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_WS_BASE_URL: string;
  readonly VITE_RAZORPAY_KEY_ID: string;
  readonly VITE_ENVIRONMENT: string;
  readonly VITE_DEBUG: string;
  readonly VITE_GOOGLE_ANALYTICS_ID: string;
  readonly VITE_FACEBOOK_PIXEL_ID: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
  readonly VITE_CDN_BASE_URL: string;
  readonly VITE_PAYMENT_SUCCESS_URL: string;
  readonly VITE_PAYMENT_CANCEL_URL: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_FACEBOOK_APP_ID: string;
  readonly VITE_ENABLE_BARGAIN_ENGINE: string;
  readonly VITE_ENABLE_SOCIAL_LOGIN: string;
  readonly VITE_ENABLE_PWA: string;
  readonly VITE_ENABLE_HTTPS: string;
  readonly VITE_CSRF_TOKEN_HEADER: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
