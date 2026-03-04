"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PencilSimple, SignOut, Trash, Faders } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Calorie settings
  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [isSavingCalories, setIsSavingCalories] = useState(false);

  // Weekly score
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [weeklyHabitsCompleted, setWeeklyHabitsCompleted] = useState(0);
  const [weeklyHabitsTotal, setWeeklyHabitsTotal] = useState(0);

  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || "");

    const [profileRes, settingsRes, habitsRes, entriesRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("calorie_settings").select("*").eq("user_id", user.id).single(),
      supabase.from("habits").select("id").eq("active", true),
      supabase
        .from("habit_entries")
        .select("completed")
        .eq("completed", true)
        .gte("entry_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]),
    ]);

    setProfile(profileRes.data || null);
    if (settingsRes.data) setCalorieTarget(String(settingsRes.data.daily_target));

    // Weekly score
    const totalHabits = (habitsRes.data || []).length;
    const totalPossible = totalHabits * 7;
    const completedCount = (entriesRes.data || []).length;
    setWeeklyHabitsCompleted(completedCount);
    setWeeklyHabitsTotal(totalPossible);
    setWeeklyScore(totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0);

    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openEdit = () => {
    setEditName(profile?.name || "");
    setEditPhone(profile?.phone || "");
    setEditProfession(profile?.profession || "");
    setEditBio(profile?.bio || "");
    setEditGoal(profile?.goal || "");
    setEditOpen(true);
  };

  // A profile "has details" if at least one optional field is filled
  const hasProfileDetails = Boolean(
    profile && (profile.profession || profile.bio || profile.goal)
  );

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    setIsSaving(true);

    try {
      if (!userId) return;

      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          name: editName.trim(),
          email: userEmail,
          phone: editPhone.trim() || null,
          profession: editProfession.trim() || null,
          bio: editBio.trim() || null,
          goal: editGoal.trim() || null,
        }, { onConflict: "id" });

      if (error) throw error;

      toast.success(hasProfileDetails ? "Profile updated" : "Profile details added!");
      setEditOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCalories = async () => {
    const target = parseInt(calorieTarget);
    if (!target || target <= 0) {
      toast.error("Enter a valid calorie target");
      return;
    }

    setIsSavingCalories(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upsert — insert or update
      const { error } = await supabase
        .from("calorie_settings")
        .upsert(
          { user_id: user.id, daily_target: target, updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );

      if (error) throw error;

      toast.success(`Calorie target set to ${target} kcal`);
      setSettingsOpen(false);
    } catch {
      toast.error("Failed to save calorie target");
    } finally {
      setIsSavingCalories(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
    toast.success("Logged out");
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setIsDeleting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete all user data in order (foreign key constraints)
      await supabase.from("habit_entries").delete().eq("user_id", user.id);
      await supabase.from("food_logs").delete().eq("user_id", user.id);
      await supabase.from("habits").delete().eq("user_id", user.id);
      await supabase.from("categories").delete().eq("user_id", user.id);
      await supabase.from("calorie_settings").delete().eq("user_id", user.id);
      await supabase.from("reports").delete().eq("user_id", user.id);
      await supabase.from("profiles").delete().eq("id", user.id);

      await supabase.auth.signOut();
      toast.success("Account deleted");
      router.replace("/login");
    } catch {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Profile" />
        <div style={{ textAlign: "center", padding: "var(--space-10)", color: "var(--text-muted)" }}>
          Loading profile...
        </div>
      </>
    );
  }

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <>
      <TopBar
        title="Profile"
        rightAction={
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: "var(--space-2)",
            }}
          >
            <Faders size={22} />
          </button>
        }
      />

      <div style={{ padding: "var(--space-4)" }}>
        {/* ========== PROFILE CARD ========== */}
        <Card padding="lg" style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "var(--accent-primary)" + "25",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--accent-primary)",
                marginBottom: "var(--space-3)",
              }}
            >
              {initials}
            </div>

            {/* Name */}
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "2px" }}>
              {profile?.name || "—"}
            </h2>

            {/* Profession */}
            {profile?.profession && (
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "var(--space-1)" }}>
                {profile.profession}
              </p>
            )}

            {/* Email */}
            <p style={{ fontSize: "12px", color: "var(--text-disabled)" }}>
              {profile?.email}
            </p>

            {/* Bio */}
            {profile?.bio && (
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  marginTop: "var(--space-3)",
                  lineHeight: 1.6,
                  maxWidth: "280px",
                }}
              >
                {profile.bio}
              </p>
            )}

            {/* Add Details vs Edit Profile */}
            {hasProfileDetails ? (
              <button
                onClick={openEdit}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                  marginTop: "var(--space-4)",
                  background: "none",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "var(--border-default)",
                  borderRadius: "var(--radius-sm)",
                  padding: "var(--space-2) var(--space-3)",
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <PencilSimple size={14} />
                Edit Profile
              </button>
            ) : (
              <div style={{ marginTop: "var(--space-4)", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>
                  Add your profession, bio, and goal to personalize your experience.
                </p>
                <Button variant="primary" onClick={openEdit} style={{ height: "40px", fontSize: "13px" }}>
                  <PencilSimple size={14} />
                  Add Profile Details
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* ========== GOAL BOX ========== */}
        {profile?.goal && (
          <div
            style={{
              padding: "var(--space-4)",
              borderLeft: "3px solid var(--accent-primary)",
              backgroundColor: "var(--bg-secondary)",
              borderRadius: "0 var(--radius-md) var(--radius-md) 0",
              marginBottom: "var(--space-4)",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--accent-primary)",
                display: "block",
                marginBottom: "var(--space-1)",
              }}
            >
              My Goal
            </span>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)" }}>
              {profile.goal}
            </p>
          </div>
        )}

        {/* ========== WEEKLY SCORE ========== */}
        <Card padding="md" style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>
                Weekly Score
              </span>
              <span
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color:
                    weeklyScore >= 80
                      ? "var(--accent-primary)"
                      : weeklyScore >= 50
                      ? "var(--status-warning)"
                      : "var(--status-error)",
                }}
              >
                {weeklyScore}%
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>
                Habits Completed
              </span>
              <span style={{ fontSize: "16px", fontWeight: 600 }}>
                {weeklyHabitsCompleted} / {weeklyHabitsTotal}
              </span>
            </div>
          </div>
          <div
            style={{
              marginTop: "var(--space-3)",
              height: "6px",
              borderRadius: "3px",
              backgroundColor: "var(--bg-tertiary)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${weeklyScore}%`,
                height: "100%",
                backgroundColor:
                  weeklyScore >= 80
                    ? "var(--accent-primary)"
                    : weeklyScore >= 50
                    ? "var(--status-warning)"
                    : "var(--status-error)",
                borderRadius: "3px",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </Card>

        {/* ========== ACTIONS ========== */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleLogout}
            style={{ gap: "var(--space-2)" }}
          >
            <SignOut size={18} />
            Log Out
          </Button>

          <button
            onClick={() => {
              setDeleteInput("");
              setDeleteOpen(true);
            }}
            style={{
              width: "100%",
              height: "44px",
              border: "none",
              background: "none",
              color: "var(--status-error)",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              opacity: 0.7,
            }}
          >
            <Trash size={14} style={{ marginRight: "var(--space-1)", verticalAlign: "middle" }} />
            Delete Account
          </button>
        </div>
      </div>

      {/* ========== EDIT PROFILE SHEET ========== */}
      <BottomSheet isOpen={editOpen} onClose={() => setEditOpen(false)} title={hasProfileDetails ? "Edit Profile" : "Add Profile Details"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <Input
            label="Phone"
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Profession"
            value={editProfession}
            onChange={(e) => setEditProfession(e.target.value)}
            placeholder="Optional"
          />
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "var(--space-1)",
              }}
            >
              Bio
            </label>
            <textarea
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="A few words about yourself..."
              style={{
                width: "100%",
                padding: "var(--space-3)",
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
            <span style={{ fontSize: "11px", color: "var(--text-disabled)", float: "right" }}>
              {editBio.length}/200
            </span>
          </div>
          <Input
            label="Goal"
            value={editGoal}
            onChange={(e) => setEditGoal(e.target.value)}
            placeholder="What are you working towards?"
          />
          <Button variant="primary" fullWidth onClick={handleSaveProfile} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </BottomSheet>

      {/* ========== SETTINGS SHEET ========== */}
      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Settings">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {/* Calorie Target */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "var(--space-3)" }}>
              Daily Calorie Target
            </h3>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Target (kcal)"
                  type="number"
                  inputMode="numeric"
                  value={calorieTarget}
                  onChange={(e) => setCalorieTarget(e.target.value)}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleSaveCalories}
                isLoading={isSavingCalories}
                style={{ height: "44px", flexShrink: 0 }}
              >
                Save
              </Button>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "var(--space-2)" }}>
              Recommended: 1,500–2,500 kcal depending on your lifestyle
            </p>
          </div>

          <div style={{ height: "1px", backgroundColor: "var(--border-default)" }} />

          {/* Quick Links */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "var(--space-3)" }}>
              Manage
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setSettingsOpen(false); router.push("/categories"); }}
                style={{ justifyContent: "flex-start" }}
              >
                📂 Categories
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => { setSettingsOpen(false); router.push("/habits"); }}
                style={{ justifyContent: "flex-start" }}
              >
                ✨ Habits
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* ========== DELETE ACCOUNT SHEET ========== */}
      <BottomSheet isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div
            style={{
              padding: "var(--space-4)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              borderRadius: "var(--radius-md)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
            }}
          >
            <p style={{ fontSize: "14px", color: "var(--status-error)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
              ⚠️ This action is irreversible
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              All your data will be permanently deleted including your profile, categories, habits,
              entries, food logs, and reports. You will be signed out immediately.
            </p>
          </div>

          <Input
            label='Type "DELETE" to confirm'
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
            placeholder="DELETE"
          />

          <Button
            variant="danger"
            fullWidth
            disabled={deleteInput !== "DELETE"}
            isLoading={isDeleting}
            onClick={handleDeleteAccount}
          >
            Permanently Delete My Account
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
