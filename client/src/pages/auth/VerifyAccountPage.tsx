import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";
import { getApiErrorMessage } from "@/api/axios";
import { NexaBrand } from "@/components/common/NexaBrand";
import { useToast } from "@/hooks/useToast";

const RESEND_COOLDOWN_SECONDS = 45;
const OTP_LENGTH = 6;

export function VerifyAccountPage() {
  const { verifyAccount, resendOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const initialEmail = (location.state as { email?: string } | null)?.email ?? "";
  const [email, setEmail] = useState(initialEmail);
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otpValue = otpDigits.join("");

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (otpValue.length !== OTP_LENGTH || loading || success) return;
    void handleVerify();
  }, [otpValue, loading, success]);

  function focusInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  function updateOtpDigit(index: number, rawValue: string) {
    const sanitized = rawValue.replace(/\D/g, "").slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = sanitized;
    setOtpDigits(nextDigits);
    setError("");

    if (sanitized && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  async function handleVerify() {
    const nextOtp = otpValue;
    if (nextOtp.length !== OTP_LENGTH || loading || success) return;

    setLoading(true);
    setError("");

    try {
      await verifyAccount({ email, otp: nextOtp });
      setSuccess(true);
      showToast("Account verified — you can now log in", "success");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid verification code. Please try again."));
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      window.setTimeout(() => focusInput(0), 0);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      if (otpDigits[index]) {
        event.preventDefault();
        const nextDigits = [...otpDigits];
        nextDigits[index] = "";
        setOtpDigits(nextDigits);
        focusInput(index);
        return;
      }

      if (index > 0) {
        event.preventDefault();
        const prevDigits = [...otpDigits];
        prevDigits[index - 1] = "";
        setOtpDigits(prevDigits);
        focusInput(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusInput(index - 1);
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusInput(index + 1);
    }
  }

  function handleOtpPaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    event.preventDefault();
    const nextDigits = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    setOtpDigits(nextDigits);
    setError("");

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    window.setTimeout(() => focusInput(nextIndex), 0);
  }

  async function handleResend() {
    if (resending || cooldown > 0) return;
    setResending(true);
    try {
      await resendOtp({ email });
      showToast("A new code was sent to your email", "success");
      startCooldown();
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not resend code"), "error");
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card otp-card">
        <NexaBrand className="auth-brand" />

        {success ? (
          <div className="otp-success-state" aria-live="polite">
            <div className="otp-success-icon">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5 9.5 17 19 7.5" />
              </svg>
            </div>
            <h1>Email Verified Successfully</h1>
            <p className="auth-subtitle">You’ll be redirected to continue to your account.</p>
          </div>
        ) : (
          <>
            <div className="otp-header">
              <h1>Verify Your Email</h1>
              <p className="auth-subtitle">We’ve sent a 6-digit verification code to</p>
            </div>

            <div className="otp-email" aria-live="polite">{email || "your email"}</div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleVerify();
              }}
              className="auth-form otp-form"
            >
              <div className="otp-grid" role="group" aria-label="One time password input">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(node) => {
                      inputRefs.current[index] = node;
                    }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    aria-label={`OTP digit ${index + 1}`}
                    className={`otp-input ${error ? "otp-input-error" : ""} ${digit ? "is-filled" : ""}`}
                    onChange={(event) => updateOtpDigit(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    onFocus={(event) => event.target.select()}
                  />
                ))}
              </div>

              <div className="otp-meta">
                <span>Didn’t receive the code?</span>
                <button
                  type="button"
                  className="otp-resend"
                  onClick={handleResend}
                  disabled={resending || cooldown > 0}
                >
                  {cooldown > 0 ? `Resend Code in ${String(Math.floor(cooldown / 60)).padStart(2, "0")}:${String(cooldown % 60).padStart(2, "0")}` : resending ? "Sending..." : "Resend Code"}
                </button>
              </div>

              {error && <p className="form-error otp-error">{error}</p>}

              <Button type="submit" fullWidth loading={loading} disabled={otpValue.length !== OTP_LENGTH}>
                {loading ? "Verifying..." : "Verify Email"}
              </Button>
            </form>

            <button type="button" className="otp-back-link" onClick={() => navigate("/signup", { state: { email } })}>
              ← Change Email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
