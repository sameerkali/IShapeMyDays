"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (otpError) {
        setError(otpError.message);
        toast.error(otpError.message);
        return;
      }

      toast.success("OTP sent to your email!");
      // Store email for the verify page
      sessionStorage.setItem("otp_email", email.trim());
      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "var(--space-8)",
      }}
    >
      {/* Brand */}
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
          Welcome Back
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "14px",
            lineHeight: 1.6,
          }}
        >
          Enter your email to receive a login code.
          <br />
          No password needed.
        </p>
      </div>

      {/* Login Form */}
      <Card
        padding="lg"
        style={{ width: "100%" }}
      >
        <form
          onSubmit={handleSendOtp}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-5)",
          }}
        >
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            error={error}
            autoComplete="email"
            autoFocus
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={isLoading}
          >
            Send Login Code
          </Button>
        </form>
      </Card>

      {/* Footer hint */}
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-muted)",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        We&apos;ll send a 6-digit code to your email.
        <br />
        New users will be automatically registered.
      </p>
    </div>
  );
}
