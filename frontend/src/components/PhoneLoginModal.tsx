import { useEffect, useRef, useState } from 'react';
import { X, Phone, ShieldCheck, CheckCircle2 } from 'lucide-react';

// ── Phone + OTP login gate (MOCK sandbox) ─────────────────────────────
// Frontend-only simulation mirroring the mock-DigiLocker-sandbox pattern
// in FeasibilityCheck.tsx: nothing leaves the browser, no backend calls.
// Sandbox OTP is always 123456.

const SANDBOX_OTP = '123456';

interface PhoneLoginModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}

type Step = 'phone' | 'otp' | 'verified';

export default function PhoneLoginModal({ open, onClose, onVerified }: PhoneLoginModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state each time the modal opens
  useEffect(() => {
    if (open) {
      setStep('phone');
      setPhone('');
      setPhoneError(null);
      setOtp(['', '', '', '', '', '']);
      setOtpError(null);
    }
  }, [open ]);

  // Escape to dismiss + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // Autofocus first OTP box when entering step 2
  useEffect(() => {
    if (open && step === 'otp') {
      otpRefs.current[0]?.focus();
    }
  }, [open, step]);

  if (!open) return null;

  const validPhone = /^[6-9]\d{9}$/.test(phone);

  const handleSendOtp = () => {
    if (!validPhone) {
      setPhoneError('Enter a valid 10-digit mobile number starting with 6–9.');
      return;
    }
    setPhoneError(null);
    setOtp(['', '', '', '', '', '']);
    setOtpError(null);
    setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    setOtpError(null);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    if (otp.join('') === SANDBOX_OTP) {
      setOtpError(null);
      setStep('verified');
    } else {
      setOtpError('Incorrect OTP. Hint: the sandbox code is 123456.');
    }
  };

  const handleAutofill = () => {
    setOtp(SANDBOX_OTP.split(''));
    setOtpError(null);
    otpRefs.current[5]?.focus();
  };

  const handleReset = () => {
    setPhone('');
    setPhoneError(null);
    setOtp(['', '', '', '', '', '']);
    setOtpError(null);
    setStep('phone');
  };

  const handleContinue = () => {
    onClose();
    onVerified();
  };

  const maskedPhone = phone.length === 10 ? `+91 •• ••• ${phone.slice(6)}` : '+91 •• ••• ••••';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Login with phone number"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-5xl p-6 sm:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close login dialog"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-olive-50 flex items-center justify-center hover:bg-olive-100 transition-colors cursor-pointer"
        >
          <X size={18} className="text-black" />
        </button>

        {step === 'phone' && (
          <>
            <div className="w-12 h-12 rounded-full bg-olive-800 flex items-center justify-center mb-4">
              <Phone size={20} className="text-white" />
            </div>
            <h2 className="font-crimson text-3xl leading-[0.9] tracking-[-0.0425em] text-black">
              Login to continue
            </h2>
            <p className="mt-2 text-sm text-black/60">
              <strong>Demo Sandbox — no real SMS is sent.</strong> Enter any valid 10-digit Indian
              mobile number to try the flow.
            </p>
            <label
              htmlFor="sandbox-phone"
              className="block mt-5 text-sm font-medium text-black"
            >
              Mobile number
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-5xl border border-olive-800/20 bg-olive-50 px-4 py-3 focus-within:border-olive-800">
              <span className="text-black font-medium">+91</span>
              <input
                id="sandbox-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                  setPhoneError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendOtp();
                }}
                className="w-full bg-transparent outline-none text-black placeholder:text-black/30"
              />
            </div>
            {phoneError && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {phoneError}
              </p>
            )}
            <button
              type="button"
              onClick={handleSendOtp}
              className="mt-4 w-full flex items-center justify-center bg-olive-800 text-white font-crimson text-2xl leading-[0.9] tracking-[-0.0425em] rounded-5xl px-6 py-3 hover:bg-olive-800/90 transition-all cursor-pointer active:scale-95"
            >
              Send OTP
            </button>
            <p className="mt-3 text-xs text-black/50 leading-relaxed">
              By continuing you agree to be contacted about your application over SMS/WhatsApp. This
              is a demo — no message is actually sent.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="w-12 h-12 rounded-full bg-olive-800 flex items-center justify-center mb-4">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h2 className="font-crimson text-3xl leading-[0.9] tracking-[-0.0425em] text-black">
              Enter OTP
            </h2>
            <p className="mt-2 text-sm text-black/60">
              Sent to +91 {phone} (sandbox — nothing was actually sent).{' '}
              <button
                type="button"
                onClick={handleReset}
                className="underline underline-offset-2 text-olive-800 cursor-pointer"
              >
                Change number
              </button>
            </p>
            <p className="mt-2 text-sm text-black/60">
              Sandbox code: <strong className="text-black">123456</strong>{' '}
              <button
                type="button"
                onClick={handleAutofill}
                className="underline underline-offset-2 text-olive-800 cursor-pointer"
              >
                Autofill
              </button>
            </p>
            <div className="mt-4 flex items-center justify-between gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? 'one-time-code' : 'off'}
                  maxLength={1}
                  aria-label={`OTP digit ${i + 1}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 sm:w-12 sm:h-13 text-center text-xl font-medium text-black rounded-2xl border border-olive-800/20 bg-olive-50 outline-none focus:border-olive-800"
                />
              ))}
            </div>
            {otpError && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {otpError}
              </p>
            )}
            <button
              type="button"
              onClick={handleVerifyOtp}
              className="mt-4 w-full flex items-center justify-center bg-olive-800 text-white font-crimson text-2xl leading-[0.9] tracking-[-0.0425em] rounded-5xl px-6 py-3 hover:bg-olive-800/90 transition-all cursor-pointer active:scale-95"
            >
              Verify OTP
            </button>
          </>
        )}

        {step === 'verified' && (
          <div className="text-center py-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-olive-800 flex items-center justify-center mb-4">
              <CheckCircle2 size={22} className="text-white" />
            </div>
            <h2 className="font-crimson text-3xl leading-[0.9] tracking-[-0.0425em] text-black">
              Phone verified
            </h2>
            <p className="mt-2 text-sm text-black/60">{maskedPhone}</p>
            <button
              type="button"
              onClick={handleContinue}
              className="mt-5 w-full flex items-center justify-center bg-olive-800 text-white font-crimson text-2xl leading-[0.9] tracking-[-0.0425em] rounded-5xl px-6 py-3 hover:bg-olive-800/90 transition-all cursor-pointer active:scale-95"
            >
              Continue →
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 text-sm underline underline-offset-2 text-olive-800 cursor-pointer"
            >
              Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
