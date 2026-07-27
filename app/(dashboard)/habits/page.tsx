"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { PlusCircle, PencilSimple, Trash, Timer, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Category, Habit } from "@/lib/types/database";
import { fetchHabitsPageData, actionSaveHabit, actionDeleteHabit } from "@/lib/server/actions";

type HabitFormData = {
  name: string; category_id: string;
  tracking_type: "boolean" | "duration";
  target_value: number; unit: string;
};

const defaultForm: HabitFormData = { name: "", category_id: "", tracking_type: "boolean", target_value: 1, unit: "" };

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HabitFormData>(defaultForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof HabitFormData, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [habitEntryCounts, setHabitEntryCounts] = useState<Record<string, number>>({});
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      const data = await fetchHabitsPageData();
      setHabits(data.habits); setCategories(data.categories); setHabitEntryCounts(data.habitEntryCounts);
    } catch { toast.error("Failed to load habits"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreateSheet = () => { setEditingId(null); setForm({ ...defaultForm, category_id: categories[0]?.id || "" }); setFormErrors({}); setSheetOpen(true); };
  const hasEntries = (id: string) => (habitEntryCounts[id] || 0) > 0;

  const openEditSheet = (habit: Habit) => {
    if (hasEntries(habit.id)) { toast.info("Habit has log entries — only active status can be changed."); return; }
    setEditingId(habit.id);
    setForm({ name: habit.name, category_id: habit.category_id, tracking_type: habit.tracking_type, target_value: habit.target_value, unit: habit.unit || "" });
    setFormErrors({}); setSheetOpen(true);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof HabitFormData, string>> = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.category_id) errors.category_id = "Select a category";
    if (form.tracking_type === "duration" && form.target_value <= 0) errors.target_value = "Target must be > 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await actionSaveHabit({ name: form.name.trim(), category_id: form.category_id, tracking_type: form.tracking_type, target_value: form.target_value, unit: form.unit.trim() || null, active: true }, editingId);
      toast.success(editingId ? "Habit updated" : "Habit created");
      setSheetOpen(false); fetchData();
    } catch { toast.error("Failed to save habit"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await actionDeleteHabit(id);
      toast.success(hasEntries(id) ? "Habit archived" : "Habit deleted");
      setDeleteConfirm(null); fetchData();
    } catch { toast.error("Failed to delete habit"); }
  };

  const toggleActive = async (habit: Habit) => {
    try {
      await actionSaveHabit({ name: habit.name, category_id: habit.category_id, tracking_type: habit.tracking_type, target_value: habit.target_value, unit: habit.unit, active: !habit.active }, habit.id);
      setHabits((prev) => prev.map((h) => h.id === habit.id ? { ...h, active: !h.active } : h));
    } catch { toast.error("Failed to update"); }
  };

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const filteredHabits = filterCategory === "all" ? habits : habits.filter((h) => h.category_id === filterCategory);
  const groupedHabits = categories
    .filter((cat) => filterCategory === "all" || cat.id === filterCategory)
    .map((cat) => ({ category: cat, habits: filteredHabits.filter((h) => h.category_id === cat.id) }))
    .filter((g) => g.habits.length > 0);
  const orphanHabits = filteredHabits.filter((h) => !categoryMap.has(h.category_id));

  return (
    <>
      <TopBar
        title="Habits"
        rightAction={
          <button
            onClick={openCreateSheet}
            aria-label="Add habit"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font)" }}
          >
            <PlusCircle size={18} weight="bold" /> Add
          </button>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Category filter */}
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
            {[{ id: "all", name: "All", color: "" }, ...categories].map((cat) => {
              const isActive = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${isActive ? "var(--white)" : "var(--border-strong)"}`,
                    backgroundColor: isActive ? "var(--white)" : "transparent",
                    color: isActive ? "var(--black)" : "var(--text-muted)",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all var(--t-fast)",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : habits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>No habits yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>
              {categories.length === 0 ? "Create a category first." : "Start building your routine."}
            </p>
            {categories.length === 0
              ? <Button variant="secondary" onClick={() => router.push("/categories")}>Create a Category First</Button>
              : <Button onClick={openCreateSheet}><PlusCircle size={16} weight="bold" /> Create First Habit</Button>
            }
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {groupedHabits.map(({ category, habits: catHabits }) => (
              <div key={category.id}>
                {/* Category header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ width: "3px", height: "14px", backgroundColor: category.color, borderRadius: "2px" }} />
                  <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                    {category.name}
                  </span>
                  <span style={{ fontSize: "10px", color: "var(--text-disabled)" }}>({catHabits.length})</span>
                </div>

                <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  {catHabits.map((habit, idx) => (
                    <div key={habit.id}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "13px 14px",
                          backgroundColor: "var(--bg-surface)",
                          borderBottom: (idx < catHabits.length - 1 || deleteConfirm === habit.id) ? "1px solid var(--border)" : "none",
                          opacity: habit.active ? 1 : 0.5,
                        }}
                      >
                        {/* Type icon */}
                        <div style={{ flexShrink: 0, color: "var(--text-muted)" }}>
                          {habit.tracking_type === "boolean"
                            ? <CheckCircle size={16} />
                            : <Timer size={16} />
                          }
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {habit.name}
                          </span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {habit.tracking_type === "boolean" ? "Yes / No" : `${habit.target_value} ${habit.unit || "min"} target`}
                          </span>
                        </div>

                        {!habit.active && <Badge variant="neutral">Off</Badge>}

                        {/* Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <button
                            onClick={() => toggleActive(habit)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: habit.active ? "var(--text-muted)" : "var(--text-disabled)", padding: "6px", fontSize: "11px", fontFamily: "var(--font)", fontWeight: 700, letterSpacing: "0.04em" }}
                          >
                            {habit.active ? "ON" : "OFF"}
                          </button>
                          <button
                            onClick={() => openEditSheet(habit)}
                            title={hasEntries(habit.id) ? "Cannot edit — has log entries" : "Edit habit"}
                            style={{ background: "none", border: "none", cursor: hasEntries(habit.id) ? "not-allowed" : "pointer", color: hasEntries(habit.id) ? "var(--text-disabled)" : "var(--text-muted)", padding: "6px", display: "flex", alignItems: "center", opacity: hasEntries(habit.id) ? 0.3 : 1 }}
                          >
                            <PencilSimple size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(habit.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-error)", padding: "6px", display: "flex", alignItems: "center" }}
                          >
                            <Trash size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Delete confirm */}
                      {deleteConfirm === habit.id && (
                        <div style={{ padding: "12px 14px", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                          <span style={{ fontSize: "12px", color: "var(--status-error)" }}>
                            {hasEntries(habit.id) ? "Archive? History preserved." : "Delete permanently?"}
                          </span>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <Button variant="ghost" onClick={() => setDeleteConfirm(null)} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}>Cancel</Button>
                            <Button variant="danger" onClick={() => handleDelete(habit.id)} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}>
                              {hasEntries(habit.id) ? "Archive" : "Delete"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {orphanHabits.length > 0 && (
              <div>
                <span style={{ fontSize: "10px", color: "var(--text-disabled)", marginBottom: "6px", display: "block" }}>Uncategorized</span>
                <Card padding="sm">
                  {orphanHabits.map((h) => (
                    <div key={h.id} style={{ padding: "10px 2px" }}>
                      <span style={{ fontSize: "13px" }}>{h.name}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? "Edit Habit" : "New Habit"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Habit Name" placeholder="e.g. Drink water, Read 30 min, Meditate" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined })); }} error={formErrors.name} autoFocus />

          {/* Category */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: formErrors.category_id ? "var(--status-error)" : "var(--text-muted)" }}>
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) => { setForm((f) => ({ ...f, category_id: e.target.value })); if (formErrors.category_id) setFormErrors((p) => ({ ...p, category_id: undefined })); }}
              style={{ height: "44px", padding: "0 14px", backgroundColor: "var(--bg-surface)", border: `1px solid ${formErrors.category_id ? "var(--status-error)" : "var(--border-strong)"}`, borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: "14px", fontFamily: "var(--font)", outline: "none", width: "100%", cursor: "pointer" }}
            >
              <option value="" disabled>Select a category</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
            {formErrors.category_id && <span style={{ fontSize: "11px", color: "var(--status-error)" }}>{formErrors.category_id}</span>}
          </div>

          {/* Tracking type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>Type</span>
            <div style={{ display: "flex", border: "1px solid var(--border-strong)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
              {([
                { value: "boolean", label: "Yes / No", icon: <CheckCircle size={15} /> },
                { value: "duration", label: "Duration", icon: <Timer size={15} /> },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm((f) => ({ ...f, tracking_type: opt.value }))}
                  type="button"
                  style={{
                    flex: 1, height: "44px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    border: "none",
                    borderRight: opt.value === "boolean" ? "1px solid var(--border-strong)" : "none",
                    backgroundColor: form.tracking_type === opt.value ? "var(--white)" : "transparent",
                    color: form.tracking_type === opt.value ? "var(--black)" : "var(--text-muted)",
                    fontSize: "13px", fontWeight: 600, fontFamily: "var(--font)", cursor: "pointer", transition: "all var(--t-fast)",
                  }}
                >
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.tracking_type === "duration" && (
            <div style={{ display: "flex", gap: "12px" }}>
              <div style={{ flex: 1 }}>
                <Input label="Target" type="number" placeholder="30" value={String(form.target_value)} onChange={(e) => setForm((f) => ({ ...f, target_value: parseFloat(e.target.value) || 0 }))} error={formErrors.target_value} />
              </div>
              <div style={{ flex: 1 }}>
                <Input label="Unit" placeholder="min, pages, km" value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} />
              </div>
            </div>
          )}

          <Button variant="primary" fullWidth onClick={handleSave} isLoading={isSaving}>
            {editingId ? "Save Changes" : "Create Habit"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
