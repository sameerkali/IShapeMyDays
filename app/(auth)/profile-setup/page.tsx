"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { toast } from "sonner";

type FormData = {
  name: string;
  phone: string;
  profession: string;
  bio: string;
  goal: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function ProfileSetupPage() {
  const [form, setForm] = useState<FormData>({
    name: "",
    phone: "",
    profession: "",
    bio: "",
    goal: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserEmail(user.email || "");

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (existingProfile) {
        router.replace("/dashboard");
      }
    };
    getUser();
  }, [supabase, router]);

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (form.phone && !/^\+?\d{7,15}$/.test(form.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Session expired. Please log in again.");
        router.replace("/login");
        return;
      }

      const { error: insertError } = await supabase.from("profiles").insert({
        id: user.id,
        name: form.name.trim(),
        email: user.email,
        phone: form.phone.trim() || null,
        profession: form.profession.trim() || null,
        bio: form.bio.trim() || null,
        goal: form.goal.trim() || null,
      });

      if (insertError) {
        // If profile already exists, try upsert
        if (insertError.code === "23505") {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              name: form.name.trim(),
              phone: form.phone.trim() || null,
              profession: form.profession.trim() || null,
              bio: form.bio.trim() || null,
              goal: form.goal.trim() || null,
            })
            .eq("id", user.id);

          if (updateError) {
            toast.error(updateError.message);
            return;
          }
        } else {
          toast.error(insertError.message);
          return;
        }
      }

      toast.success("Profile created! Let's get started.");
      router.replace("/dashboard");
    } catch {
      toast.error("Something went wrong. Please try again.");
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
        gap: "var(--space-6)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--bg-tertiary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto var(--space-4)",
            fontSize: "24px",
            color: "var(--text-muted)",
          }}
        >
          {form.name ? form.name[0].toUpperCase() : "?"}
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "var(--space-2)",
          }}
        >
          Complete Your Profile
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Tell us a bit about yourself to personalize your experience.
        </p>
      </div>

      {/* Form */}
      <Card padding="lg" style={{ width: "100%" }}>
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          <Input
            label="Full Name"
            placeholder="Your name"
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={errors.name}
            autoFocus
            required
          />

          <Input
            label="Email"
            type="email"
            value={userEmail}
            disabled
            helperText="Email from your login — cannot be changed."
            style={{ opacity: 0.6 }}
          />

          <Input
            label="Phone (Optional)"
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            error={errors.phone}
          />

          <Input
            label="Profession (Optional)"
            placeholder="e.g. Developer, Student, Designer"
            value={form.profession}
            onChange={(e) => updateField("profession", e.target.value)}
          />

          {/* Bio textarea */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
            }}
          >
            <label
              htmlFor="bio"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              placeholder="A short bio about yourself..."
              value={form.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              maxLength={200}
              rows={3}
              style={{
                padding: "var(--space-3) var(--space-4)",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                resize: "vertical",
                minHeight: "80px",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--border-focus)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--border-default)";
              }}
            />
            <span
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                textAlign: "right",
              }}
            >
              {form.bio.length}/200
            </span>
          </div>

          {/* Goal input with accent styling */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-1)",
            }}
          >
            <label
              htmlFor="goal"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent-primary)",
              }}
            >
              Your Goal
            </label>
            <input
              id="goal"
              placeholder="e.g. Build a habit of reading 30 mins daily"
              value={form.goal}
              onChange={(e) => updateField("goal", e.target.value)}
              maxLength={100}
              style={{
                height: "44px",
                padding: "0 var(--space-4)",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--accent-primary)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color var(--transition-fast)",
                width: "100%",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              What motivates you to track your habits?
            </span>
          </div>

          <div style={{ marginTop: "var(--space-2)" }}>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={isLoading}
            >
              Save & Start Tracking
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
