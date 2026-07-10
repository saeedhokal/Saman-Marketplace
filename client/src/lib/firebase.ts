import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDZ3yxWoX8AgxDtjZIbJtM3Zjt1gSAcN90",
  authDomain: "saman-car-spare-parts.firebaseapp.com",
  projectId: "saman-car-spare-parts",
  storageBucket: "saman-car-spare-parts.firebasestorage.app",
  messagingSenderId: "968293545131",
  appId: "1:968293545131:android:2b20f890199d475e9ab3ee",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

function cleanupRecaptcha() {
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch {}
    recaptchaVerifier = null;
  }
  const old = document.getElementById('recaptcha-container');
  if (old) {
    const parent = old.parentElement;
    old.remove();
    if (parent) {
      const fresh = document.createElement('div');
      fresh.id = 'recaptcha-container';
      parent.appendChild(fresh);
    }
  }

  document.querySelectorAll('iframe[src*="recaptcha"]').forEach(el => {
    try { el.remove(); } catch {}
  });
  document.querySelectorAll('.grecaptcha-badge').forEach(el => {
    try { el.remove(); } catch {}
  });
}

export async function sendOTP(phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneForFirebase(phoneNumber);
    console.log('[Firebase] Sending OTP to:', formattedPhone);

    cleanupRecaptcha();

    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      document.body.appendChild(container);
    }

    recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('[Firebase] reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('[Firebase] reCAPTCHA expired');
        cleanupRecaptcha();
      },
    });

    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
    console.log('[Firebase] OTP sent successfully');
    return true;
  } catch (error: any) {
    console.error('[Firebase] Send OTP error:', error?.code, error?.message);
    fetch('/api/log-otp-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: error?.code, message: error?.message, phone: phoneNumber })
    }).catch(() => {});
    cleanupRecaptcha();
    throw error;
  }
}

// Service-level failures: Firebase itself is broken or misconfigured
// (billing, quota, project config). These are NOT the user's fault, so
// registration can fall back to the direct (unverified) path instead of
// blocking sign-ups entirely.
// Deliberately NOT included: captcha-check-failed and network-request-failed
// (usually caused by the user's own connection/browser session, not an outage).
const SERVICE_LEVEL_OTP_ERRORS = new Set([
  'auth/billing-not-enabled',
  'auth/quota-exceeded',
  'auth/internal-error',
  'auth/app-not-authorized',
  'auth/operation-not-allowed',
]);

export function isServiceLevelOTPError(error: any): boolean {
  return typeof error?.code === 'string' && SERVICE_LEVEL_OTP_ERRORS.has(error.code);
}

export async function verifyOTP(code: string): Promise<string> {
  if (!confirmationResult) {
    throw new Error('No OTP was sent. Please request a new code.');
  }
  try {
    const result = await confirmationResult.confirm(code);
    const idToken = await result.user.getIdToken();
    await auth.signOut();
    return idToken;
  } catch (error: any) {
    console.error('[Firebase] Verify OTP error:', error);
    throw error;
  }
}

function formatPhoneForFirebase(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('971')) return `+${digits}`;
  if (digits.startsWith('0')) return `+971${digits.slice(1)}`;
  return `+971${digits}`;
}

export { auth };
