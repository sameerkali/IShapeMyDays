"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import {
  UserCircle,
  PencilSimple,
  SignOut,
  Trash,
  Faders,
  Fire,
  Target,
  Envelope,
  Phone,
  Briefcase,
  CaretRight,
  FolderOpen,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
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
      if (!userId) return;

      const { error } = await supabase
        .from("calorie_settings")
        .upsert(
          { user_id: userId, daily_target: target, updated_at: new Date().toISOString() },
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
    toast.success("Logged out successfully");
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    setIsDeleting(true);

    try {
      if (!userId) return;

      await supabase.from("habit_entries").delete().eq("user_id", userId);
      await supabase.from("food_logs").delete().eq("user_id", userId);
      await supabase.from("habits").delete().eq("user_id", userId);
      await supabase.from("categories").delete().eq("user_id", userId);
      await supabase.from("calorie_settings").delete().eq("user_id", userId);
      await supabase.from("reports").delete().eq("user_id", userId);
      await supabase.from("profiles").delete().eq("id", userId);

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

  const scoreColor =
    weeklyScore >= 80
      ? "var(--accent-primary)"
      : weeklyScore >= 50
      ? "var(--status-warning)"
      : "var(--status-error)";

  // Menu item helper
  const MenuItem = ({
    icon,
    label,
    value,
    danger,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    danger?: boolean;
    onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        width: "100%",
        padding: "var(--space-3) var(--space-4)",
        background: "none",
        borderWidth: 0,
        borderStyle: "none",
        borderColor: "transparent",
        color: danger ? "var(--status-error)" : "var(--text-primary)",
        fontSize: "14px",
        fontFamily: "inherit",
        cursor: "pointer",
        borderRadius: "var(--radius-sm)",
        transition: "background var(--transition-fast)",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = danger
          ? "rgba(239,68,68,0.08)"
          : "var(--bg-tertiary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
      }}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {value && (
        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{value}</span>
      )}
      {!value && !danger && (
        <CaretRight size={16} color="var(--text-disabled)" />
      )}
    </button>
  );

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
              borderWidth: 0,
              borderStyle: "none",
              borderColor: "transparent",
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
        {/* ========== PROFILE HERO ========== */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(99,102,241,0.08) 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-8) var(--space-4) var(--space-6)",
            marginBottom: "var(--space-4)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle decorative ring */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              border: "2px solid rgba(16,185,129,0.1)",
            }}
          />

          {/* Profile Icon */}
          <div
            style={{
              width: "96px",
              height: "96px",
              margin: "0 auto var(--space-4)",
              borderRadius: "50%",
              background: "linear-gradient(145deg, var(--accent-primary), var(--accent-hover))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
            }}
          >
            <UserCircle size={64} weight="thin" color="#ffffff" />
          </div>

          {/* Name */}
          <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
            {profile?.name || "—"}
          </h2>

          {/* Profession */}
          {profile?.profession && (
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "var(--space-1)",
              }}
            >
              {profile.profession}
            </p>
          )}

          {/* Bio */}
          {profile?.bio && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginTop: "var(--space-2)",
                lineHeight: 1.6,
                maxWidth: "300px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {profile.bio}
            </p>
          )}

          {/* Add / Edit button */}
          {hasProfileDetails ? (
            <button
              onClick={openEdit}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "var(--space-4)",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "rgba(255,255,255,0.1)",
                borderRadius: "var(--radius-full)",
                padding: "var(--space-2) var(--space-4)",
                color: "var(--text-secondary)",
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
            <div style={{ marginTop: "var(--space-4)" }}>
              <p
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "var(--space-3)",
                }}
              >
                Complete your profile to personalize your experience
              </p>
              <Button
                variant="primary"
                onClick={openEdit}
                style={{ height: "40px", fontSize: "13px", borderRadius: "var(--radius-full)" }}
              >
                <PencilSimple size={14} />
                Add Profile Details
              </Button>
            </div>
          )}
        </div>

        {/* ========== INFO CARDS ROW ========== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--space-3)",
            marginBottom: "var(--space-4)",
          }}
        >
          {/* Weekly Score */}
          <Card padding="md">
            <div style={{ textAlign: "center" }}>
              <Fire size={24} weight="fill" color={scoreColor} />
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: scoreColor,
                  marginTop: "var(--space-1)",
                }}
              >
                {weeklyScore}%
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Weekly Score
              </div>
              <div
                style={{
                  marginTop: "var(--space-2)",
                  height: "4px",
                  borderRadius: "2px",
                  backgroundColor: "var(--bg-tertiary)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${weeklyScore}%`,
                    height: "100%",
                    backgroundColor: scoreColor,
                    borderRadius: "2px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Habits Done */}
          <Card padding="md">
            <div style={{ textAlign: "center" }}>
              <Target size={24} weight="fill" color="var(--accent-secondary)" />
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  marginTop: "var(--space-1)",
                }}
              >
                {weeklyHabitsCompleted}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                of {weeklyHabitsTotal} this week
              </div>
            </div>
          </Card>
        </div>

        {/* ========== GOAL ========== */}
        {profile?.goal && (
          <Card padding="md" style={{ marginBottom: "var(--space-4)" }}>
            <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "var(--radius-sm)",
                  backgroundColor: "rgba(16,185,129,0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Target size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: "var(--accent-primary)",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  My Goal
                </span>
                <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                  {profile.goal}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ========== CONTACT INFO ========== */}
        <Card padding="sm" style={{ marginBottom: "var(--space-4)" }}>
          <MenuItem
            icon={<Envelope size={18} color="var(--text-muted)" />}
            label="Email"
            value={profile?.email || userEmail}
          />
          {profile?.phone && (
            <>
              <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "0 var(--space-4)" }} />
              <MenuItem
                icon={<Phone size={18} color="var(--text-muted)" />}
                label="Phone"
                value={profile.phone}
              />
            </>
          )}
          {profile?.profession && (
            <>
              <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "0 var(--space-4)" }} />
              <MenuItem
                icon={<Briefcase size={18} color="var(--text-muted)" />}
                label="Profession"
                value={profile.profession}
              />
            </>
          )}
        </Card>

        {/* ========== MANAGE SECTION ========== */}
        <Card padding="sm" style={{ marginBottom: "var(--space-4)" }}>
          <MenuItem
            icon={<FolderOpen size={18} color="var(--text-muted)" />}
            label="Categories"
            onClick={() => router.push("/categories")}
          />
          <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "0 var(--space-4)" }} />
          <MenuItem
            icon={<Sparkle size={18} color="var(--text-muted)" />}
            label="Habits"
            onClick={() => router.push("/habits")}
          />
          <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "0 var(--space-4)" }} />
          <MenuItem
            icon={<Faders size={18} color="var(--text-muted)" />}
            label="Calorie Target"
            value={`${calorieTarget} kcal`}
            onClick={() => setSettingsOpen(true)}
          />
        </Card>

        {/* ========== ACCOUNT SECTION ========== */}
        <Card padding="sm" style={{ marginBottom: "var(--space-6)" }}>
          <MenuItem
            icon={<SignOut size={18} color="var(--text-muted)" />}
            label="Log Out"
            onClick={() => setLogoutOpen(true)}
          />
          <div style={{ height: "1px", backgroundColor: "var(--border-default)", margin: "0 var(--space-4)" }} />
          <MenuItem
            icon={<Trash size={18} color="var(--status-error)" />}
            label="Delete Account"
            danger
            onClick={() => {
              setDeleteInput("");
              setDeleteOpen(true);
            }}
          />
        </Card>
      </div>

      {/* ========== EDIT PROFILE SHEET ========== */}
      <BottomSheet
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title={hasProfileDetails ? "Edit Profile" : "Add Profile Details"}
      >
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
            placeholder="e.g. Developer, Designer, Student"
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
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--border-default)",
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
            {hasProfileDetails ? "Save Changes" : "Save Profile"}
          </Button>
        </div>
      </BottomSheet>

      {/* ========== CALORIE SETTINGS SHEET ========== */}
      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Calorie Target">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Daily Target (kcal)"
            type="number"
            inputMode="numeric"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(e.target.value)}
          />
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Recommended: 1,500–2,500 kcal depending on your lifestyle
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSaveCalories}
            isLoading={isSavingCalories}
          >
            Save Target
          </Button>
        </div>
      </BottomSheet>

      {/* ========== LOGOUT CONFIRMATION SHEET ========== */}
      <BottomSheet isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} title="Log Out">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ textAlign: "center", padding: "var(--space-2) 0" }}>
            <SignOut
              size={40}
              weight="duotone"
              color="var(--text-muted)"
              style={{ marginBottom: "var(--space-3)" }}
            />
            <p style={{ fontSize: "15px", fontWeight: 500, marginBottom: "var(--space-1)" }}>
              Are you sure you want to log out?
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Your data is safe — you can log back in anytime.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setLogoutOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleLogout}
            >
              Log Out
            </Button>
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
              borderWidth: "1px",
              borderStyle: "solid",
              borderColor: "rgba(239, 68, 68, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
              <WarningCircle size={20} weight="fill" color="var(--status-error)" />
              <span style={{ fontSize: "14px", color: "var(--status-error)", fontWeight: 600 }}>
                This action is irreversible
              </span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              All your data will be permanently deleted — profile, categories,
              habits, entries, food logs, and reports.
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
