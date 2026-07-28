"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonCard, Skeleton } from "@/components/ui/Skeleton";
import {
  PencilSimple, Faders, Fire, Target,
  Envelope, Phone, Briefcase, FolderOpen,
  Sparkle, CaretRight,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/database";
import { fetchProfilePageData, actionUpdateProfile, actionUpdateCalorieTarget } from "@/lib/server/actions";
import { fetchWithCache, invalidateCache } from "@/lib/client/cache";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editProfession, setEditProfession] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGoal, setEditGoal] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  const [calorieTarget, setCalorieTarget] = useState("2000");
  const [isSavingCalories, setIsSavingCalories] = useState(false);
  const [weeklyScore, setWeeklyScore] = useState(0);
  const [weeklyHabitsCompleted, setWeeklyHabitsCompleted] = useState(0);
  const [weeklyHabitsTotal, setWeeklyHabitsTotal] = useState(0);

  const router = useRouter();
  const LIMITS = { name: 30, phone: 10, profession: 50, bio: 500, goal: 200 };
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) invalidateCache("profile_page");
      const data = await fetchWithCache("profile_page", () => fetchProfilePageData());
      setProfile(data.profile); setUserEmail(data.profile.email);
      setCalorieTarget(String(data.calorieTarget));
      const totalHabits = data.habitsCount;
      const totalPossible = totalHabits * 7;
      const completedCount = data.entriesCount;
      setWeeklyHabitsCompleted(completedCount); setWeeklyHabitsTotal(totalPossible);
      setWeeklyScore(totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0);
    } catch { toast.error("Failed to load profile"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const handleFocus = () => fetchData();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchData]);

  const openEdit = () => {
    setEditName(profile?.name || ""); setEditPhone(profile?.phone || "");
    setEditProfession(profile?.profession || ""); setEditBio(profile?.bio || "");
    setEditGoal(profile?.goal || "");
    setEditWeight(profile?.weight != null ? String(profile.weight) : "");
    setEditOpen(true);
  };

  const hasProfileDetails = Boolean(profile && (profile.profession || profile.bio || profile.goal || profile.weight));

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const name = editName.trim(); const phone = editPhone.trim(); const weightStr = editWeight.trim();
    if (!name) errors.name = "Name is required";
    else if (name.length > LIMITS.name) errors.name = `Max ${LIMITS.name} characters`;
    if (phone && !/^\d{10}$/.test(phone)) errors.phone = "Must be exactly 10 digits";
    if (weightStr && (isNaN(Number(weightStr)) || Number(weightStr) <= 0 || Number(weightStr) > 500)) {
      errors.weight = "Enter a valid weight in kg";
    }
    if (editProfession.trim().length > LIMITS.profession) errors.profession = `Max ${LIMITS.profession} characters`;
    if (editBio.trim().length > LIMITS.bio) errors.bio = `Max ${LIMITS.bio} characters`;
    if (editGoal.trim().length > LIMITS.goal) errors.goal = `Max ${LIMITS.goal} characters`;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const parsedWeight = editWeight.trim() ? parseFloat(editWeight.trim()) : null;
      await actionUpdateProfile({
        name: editName.trim(),
        email: userEmail,
        phone: editPhone.trim() || null,
        profession: editProfession.trim() || null,
        bio: editBio.trim() || null,
        goal: editGoal.trim() || null,
        weight: parsedWeight,
      });
      toast.success("Profile saved"); setEditOpen(false); fetchData(true);
    } catch { toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const handleSaveCalories = async () => {
    const target = parseInt(calorieTarget);
    if (!target || target <= 0) { toast.error("Enter a valid calorie target"); return; }
    setIsSavingCalories(true);
    try {
      await actionUpdateCalorieTarget(target);
      toast.success(`Calorie target set to ${target} kcal`);
      setSettingsOpen(false);
    } catch { toast.error("Failed to save"); }
    finally { setIsSavingCalories(false); }
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="Profile" />
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Skeleton width="56px" height="56px" borderRadius="var(--radius-sm)" />
              <div style={{ flex: 1 }}>
                <Skeleton width="120px" height="18px" />
                <Skeleton width="80px" height="12px" style={{ marginTop: "6px" }} />
              </div>
            </div>
          </SkeletonCard>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      </>
    );
  }

  const scoreBarColor = weeklyScore >= 80 ? "var(--status-success)" : weeklyScore >= 50 ? "var(--status-warning)" : "var(--status-error)";

  // Inline MenuItem component
  const MenuItem = ({ icon, label, value, danger, onClick }: {
    icon: React.ReactNode; label: string; value?: string; danger?: boolean; onClick?: () => void;
  }) => (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "12px", width: "100%",
        padding: "14px 16px", background: "none", border: "none",
        color: danger ? "var(--status-error)" : "var(--text-primary)",
        fontSize: "13px", fontFamily: "var(--font)", cursor: "pointer",
        textAlign: "left", transition: "background var(--t-fast)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = danger ? "rgba(248,113,113,0.06)" : "var(--bg-elevated)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <span style={{ flexShrink: 0, display: "flex", color: "var(--text-muted)" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 500 }}>{label}</span>
      {value && <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500 }}>{value}</span>}
      {!value && !danger && <CaretRight size={14} color="var(--text-disabled)" />}
    </button>
  );

  return (
    <>
      <TopBar title="Profile" />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>

        {/* ── PROFILE CARD ── */}
        <Card padding="lg">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px", lineHeight: 1.2 }}>
                {profile?.name || "—"}
              </h2>
              {profile?.bio && (
                <p
                  onClick={() => setBioExpanded(!bioExpanded)}
                  style={{
                    fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "4px", cursor: "pointer",
                    ...(!bioExpanded ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" } : {}),
                  }}
                >
                  {profile.bio}
                </p>
              )}
              {!hasProfileDetails && (
                <p style={{ fontSize: "12px", color: "var(--text-disabled)", marginTop: "4px" }}>Tap Edit to add your details</p>
              )}
            </div>
            <button
              onClick={openEdit}
              aria-label="Edit Profile"
              style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font)", cursor: "pointer", padding: "4px 0", flexShrink: 0, marginLeft: "12px" }}
            >
              <PencilSimple size={13} /> Edit
            </button>
          </div>
        </Card>

        {/* ── STATS ROW ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
          <Card padding="md">
            <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>Weekly Score</p>
            <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1, color: scoreBarColor }}>{weeklyScore}%</div>
            <div style={{ marginTop: "10px", height: "3px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${weeklyScore}%`, height: "100%", backgroundColor: scoreBarColor, transition: "width 0.5s ease" }} />
            </div>
          </Card>
          <Card padding="md">
            <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>This Week</p>
            <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>{weeklyHabitsCompleted}</div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>of {weeklyHabitsTotal} done</p>
          </Card>
          <Card padding="md" onClick={openEdit} style={{ cursor: "pointer" }}>
            <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "6px" }}>Weight</p>
            <div style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {profile?.weight != null ? `${profile.weight}` : "—"}
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{profile?.weight != null ? "kg" : "Tap to set"}</p>
          </Card>
        </div>

        {/* ── GOAL ── */}
        {profile?.goal && (
          <Card padding="md">
            <p style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>My Goal</p>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--text-secondary)" }}>{profile.goal}</p>
          </Card>
        )}

        {/* ── MANAGE ── */}
        <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <MenuItem icon={<FolderOpen size={16} />} label="Categories" onClick={() => router.push("/categories")} />
          <div style={{ height: "1px", backgroundColor: "var(--border)" }} />
          <MenuItem icon={<Sparkle size={16} />} label="Habits" onClick={() => router.push("/habits")} />
          <div style={{ height: "1px", backgroundColor: "var(--border)" }} />
          <MenuItem icon={<Faders size={16} />} label="Calorie Target" value={`${calorieTarget} kcal`} onClick={() => setSettingsOpen(true)} />
        </div>

        {/* Streak fire icon */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", padding: "8px", color: "var(--text-disabled)" }}>
          <Fire size={14} />
          <Target size={14} />
          <span style={{ fontSize: "10px", letterSpacing: "0.04em" }}>ISHAPEMYDAYS</span>
        </div>
      </div>

      {/* ── EDIT PROFILE SHEET ── */}
      <BottomSheet isOpen={editOpen} onClose={() => { setEditOpen(false); setFormErrors({}); }} title={hasProfileDetails ? "Edit Profile" : "Add Details"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <Input label="Name *" value={editName} onChange={(e) => { if (e.target.value.length <= LIMITS.name) setEditName(e.target.value); setFormErrors((p) => ({ ...p, name: "" })); }} autoFocus placeholder="Your full name" style={formErrors.name ? { borderColor: "var(--status-error)" } : undefined} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", color: formErrors.name ? "var(--status-error)" : "transparent" }}>{formErrors.name || "."}</span>
              <span style={{ fontSize: "10px", color: editName.length >= LIMITS.name ? "var(--status-error)" : "var(--text-disabled)" }}>{editName.length}/{LIMITS.name}</span>
            </div>
          </div>

          <div>
            <Input label="Weight (kg)" type="number" step="0.1" value={editWeight} onChange={(e) => { setEditWeight(e.target.value); setFormErrors((p) => ({ ...p, weight: "" })); }} placeholder="e.g. 70.5" inputMode="decimal" style={formErrors.weight ? { borderColor: "var(--status-error)" } : undefined} />
            <span style={{ fontSize: "10px", color: formErrors.weight ? "var(--status-error)" : "transparent", display: "block", marginTop: "4px" }}>{formErrors.weight || "."}</span>
          </div>

          <div>
            <Input label="Phone" value={editPhone} onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, LIMITS.phone); setEditPhone(v); setFormErrors((p) => ({ ...p, phone: "" })); }} placeholder="10-digit number" inputMode="numeric" style={formErrors.phone ? { borderColor: "var(--status-error)" } : undefined} />
            <span style={{ fontSize: "10px", color: formErrors.phone ? "var(--status-error)" : "transparent", display: "block", marginTop: "4px" }}>{formErrors.phone || "."}</span>
          </div>

          <Input label="Profession" value={editProfession} onChange={(e) => { if (e.target.value.length <= LIMITS.profession) setEditProfession(e.target.value); }} placeholder="e.g. Developer, Student" />

          <div>
            <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>Bio</label>
            <textarea
              value={editBio}
              onChange={(e) => { if (e.target.value.length <= LIMITS.bio) setEditBio(e.target.value); }}
              rows={3}
              placeholder="A few words about yourself..."
              style={{ width: "100%", padding: "12px 14px", backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "14px", fontFamily: "var(--font)", resize: "vertical", outline: "none", transition: "border-color var(--t-fast)" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--white)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            />
          </div>

          <Input label="Goal" value={editGoal} onChange={(e) => { if (e.target.value.length <= LIMITS.goal) setEditGoal(e.target.value); }} placeholder="What are you working towards?" />

          <Button variant="primary" fullWidth onClick={handleSaveProfile} isLoading={isSaving}>
            {hasProfileDetails ? "Save Changes" : "Save Profile"}
          </Button>
        </div>
      </BottomSheet>

      {/* ── CALORIE SETTINGS SHEET ── */}
      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title="Calorie Target">
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Daily Target (kcal)" type="number" inputMode="numeric" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} />
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Recommended: 1,500–2,500 kcal depending on your lifestyle</p>
          <Button variant="primary" fullWidth onClick={handleSaveCalories} isLoading={isSavingCalories}>Save Target</Button>
        </div>
      </BottomSheet>
    </>
  );
}
