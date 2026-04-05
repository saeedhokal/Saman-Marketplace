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

export function setupRecaptcha(elementId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {
      console.log('[Firebase] reCAPTCHA expired');
    },
  });
  return recaptchaVerifier;
}

export async function sendOTP(phoneNumber: string): Promise<boolean> {
  try {
    const formattedPhone = formatPhoneForFirebase(phoneNumber);
    console.log('[Firebase] Sending OTP to:', formattedPhone);
    const container = document.getElementById('recaptcha-container');
    console.log('[Firebase] reCAPTCHA container found:', !!container);
    const appVerifier = setupRecaptcha('recaptcha-container');
    console.log('[Firebase] reCAPTCHA verifier created');
    confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    console.log('[Firebase] OTP sent successfully');
    return true;
  } catch (error: any) {
    console.error('[Firebase] Send OTP error:', error?.code, error?.message, JSON.stringify(error));
    fetch('/api/log-otp-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: error?.code, message: error?.message, phone: phoneNumber })
    }).catch(() => {});
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
    throw error;
  }
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
