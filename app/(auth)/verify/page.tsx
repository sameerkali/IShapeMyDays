"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

const OTP_LENGTH = 8;

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("otp_email");
    if (!storedEmail) {
      router.replace("/login");
      return;
    }
    setEmail(storedEmail);
    // Focus first input
    inputRefs.current[0]?.focus();
  }, [router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = useCallback(async (otpCode: string) => {
    if (!email) return;
    setError("");
    setIsLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (verifyError) {
        setError("Invalid or expired code. Please try again.");
        toast.error("Verification failed");
        // Clear OTP and refocus
        setOtp(new Array(OTP_LENGTH).fill(""));
        inputRefs.current[0]?.focus();
        return;
      }

      toast.success("Logged in successfully!");
      sessionStorage.removeItem("otp_email");

      // Check if profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (profile) {
          router.replace("/dashboard");
        } else {
          router.replace("/profile-setup");
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Verification failed");
    } finally {
      setIsLoading(false);
    }
  }, [email, supabase, router]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (error) setError("");

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === OTP_LENGTH - 1) {
      const fullOtp = newOtp.join("");
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Move to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);

    // Focus last filled input or submit
    if (pastedData.length === OTP_LENGTH) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendCooldown(30);
    setError("");

    try {
      const { error: resendError } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });

      if (resendError) {
        toast.error(resendError.message);
        return;
      }

      toast.success("New code sent!");
      setOtp(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code");
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    : "";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-8)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-lg)",
            backgroundColor: "var(--accent-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-6)",
            fontSize: "24px",
            fontWeight: 700,
            color: "#fff",
          }}
        >
          I
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "var(--space-2)" }}>
          Check Your Email
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          We sent an 8-digit code to
          <br />
          <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            {maskedEmail}
          </span>
        </p>
      </div>

      {/* OTP Input */}
      <Card padding="lg" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--space-5)",
          }}
        >
          {/* OTP Boxes */}
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              justifyContent: "center",
            }}
            onPaste={handlePaste}
          >
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                aria-label={`Digit ${index + 1}`}
                style={{
                  width: "40px",
                  height: "56px",
                  textAlign: "center",
                  fontSize: "20px",
                  fontWeight: 700,
                  fontFamily: "inherit",
                  backgroundColor: "var(--bg-primary)",
                  border: `2px solid ${
                    error
                      ? "var(--status-error)"
                      : digit
                      ? "var(--accent-primary)"
                      : "var(--border-default)"
                  }`,
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                  outline: "none",
                  transition: "border-color var(--transition-fast)",
                  caretColor: "var(--accent-primary)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-primary)";
                }}
                onBlur={(e) => {
                  if (!digit) {
                    e.currentTarget.style.borderColor = error
                      ? "var(--status-error)"
                      : "var(--border-default)";
                  }
                }}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p
              style={{
                color: "var(--status-error)",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {error}
            </p>
          )}

          {/* Verify Button */}
          <Button
            type="button"
            variant="primary"
            fullWidth
            isLoading={isLoading}
            disabled={otp.join("").length < OTP_LENGTH}
            onClick={() => handleVerify(otp.join(""))}
          >
            Verify Code
          </Button>

          {/* Resend */}
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Didn&apos;t receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendCooldown > 0}
              style={{
                background: "none",
                border: "none",
                color:
                  resendCooldown > 0
                    ? "var(--text-disabled)"
                    : "var(--accent-primary)",
                cursor: resendCooldown > 0 ? "default" : "pointer",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "inherit",
                padding: "var(--space-1) 0",
              }}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend Code"}
            </button>
          </div>
        </div>
      </Card>

      {/* Back to login */}
      <button
        onClick={() => {
          sessionStorage.removeItem("otp_email");
          router.push("/login");
        }}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: "13px",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        ← Use a different email
      </button>
    </div>
  );
}
