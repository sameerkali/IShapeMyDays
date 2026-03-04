"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlusCircle, PencilSimple, Trash, Timer, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Category, Habit } from "@/lib/types/database";

type HabitFormData = {
  name: string;
  category_id: string;
  tracking_type: "boolean" | "duration";
  target_value: number;
  unit: string;
};

const defaultForm: HabitFormData = {
  name: "",
  category_id: "",
  tracking_type: "boolean",
  target_value: 1,
  unit: "",
};

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
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const router = useRouter();
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const [habitsRes, categoriesRes] = await Promise.all([
      supabase.from("habits").select("*").order("created_at", { ascending: true }),
      supabase.from("categories").select("*").order("order", { ascending: true }),
    ]);

    if (habitsRes.error) toast.error("Failed to load habits");
    if (categoriesRes.error) toast.error("Failed to load categories");

    setHabits(habitsRes.data || []);
    setCategories(categoriesRes.data || []);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateSheet = () => {
    setEditingId(null);
    setForm({
      ...defaultForm,
      category_id: categories[0]?.id || "",
    });
    setFormErrors({});
    setSheetOpen(true);
  };

  const openEditSheet = (habit: Habit) => {
    setEditingId(habit.id);
    setForm({
      name: habit.name,
      category_id: habit.category_id,
      tracking_type: habit.tracking_type,
      target_value: habit.target_value,
      unit: habit.unit || "",
    });
    setFormErrors({});
    setSheetOpen(true);
  };

  const validate = (): boolean => {
    const errors: Partial<Record<keyof HabitFormData, string>> = {};
    if (!form.name.trim()) errors.name = "Habit name is required";
    if (!form.category_id) errors.category_id = "Select a category";
    if (form.tracking_type === "duration" && form.target_value <= 0) {
      errors.target_value = "Target must be greater than 0";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("habits")
          .update({
            name: form.name.trim(),
            category_id: form.category_id,
            tracking_type: form.tracking_type,
            target_value: form.target_value,
            unit: form.unit.trim() || null,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Habit updated");
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("habits").insert({
          user_id: user.id,
          name: form.name.trim(),
          category_id: form.category_id,
          tracking_type: form.tracking_type,
          target_value: form.target_value,
          unit: form.unit.trim() || null,
          active: true,
        });

        if (error) throw error;
        toast.success("Habit created");
      }

      setSheetOpen(false);
      fetchData();
    } catch {
      toast.error("Failed to save habit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
      toast.success("Habit deleted");
      setDeleteConfirm(null);
      fetchData();
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  const toggleActive = async (habit: Habit) => {
    const { error } = await supabase
      .from("habits")
      .update({ active: !habit.active })
      .eq("id", habit.id);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, active: !h.active } : h))
    );
  };

  // Group habits by category
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const filteredHabits =
    filterCategory === "all"
      ? habits
      : habits.filter((h) => h.category_id === filterCategory);

  const groupedHabits = categories
    .filter((cat) => filterCategory === "all" || cat.id === filterCategory)
    .map((cat) => ({
      category: cat,
      habits: filteredHabits.filter((h) => h.category_id === cat.id),
    }))
    .filter((group) => group.habits.length > 0);

  // Habits without a matching category (orphans)
  const orphanHabits = filteredHabits.filter((h) => !categoryMap.has(h.category_id));

  return (
    <>
      <TopBar
        title="Habits"
        rightAction={
          <button
            onClick={openCreateSheet}
            aria-label="Add habit"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--accent-primary)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-1)",
              fontSize: "14px",
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            <PlusCircle size={22} weight="bold" />
            Add
          </button>
        }
      />

      <div style={{ padding: "var(--space-4)" }}>
        {/* Category Filter */}
        {categories.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              overflowX: "auto",
              paddingBottom: "var(--space-3)",
              marginBottom: "var(--space-3)",
            }}
          >
            <button
              onClick={() => setFilterCategory("all")}
              style={{
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                borderColor: filterCategory === "all" ? "var(--accent-primary)" : "var(--border-default)",
                backgroundColor: filterCategory === "all" ? "var(--accent-primary)" + "20" : "transparent",
                color: filterCategory === "all" ? "var(--accent-primary)" : "var(--text-muted)",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                style={{
                  padding: "var(--space-2) var(--space-3)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  borderColor: filterCategory === cat.id ? cat.color : "var(--border-default)",
                  backgroundColor: filterCategory === cat.id ? cat.color + "20" : "transparent",
                  color: filterCategory === cat.id ? cat.color : "var(--text-muted)",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)" }}>
            Loading habits...
          </div>
        ) : habits.length === 0 ? (
          /* Empty State */
          <div style={{ textAlign: "center", padding: "var(--space-10) var(--space-4)" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                backgroundColor: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto var(--space-4)",
                fontSize: "28px",
              }}
            >
              ✨
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-2)" }}>
              No habits yet
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "var(--space-6)" }}>
              {categories.length === 0
                ? "Create a category first, then add habits."
                : "Start building your daily routine."}
            </p>
            {categories.length === 0 ? (
              <Button onClick={() => router.push("/categories")}>
                Create a Category First
              </Button>
            ) : (
              <Button onClick={openCreateSheet}>
                <PlusCircle size={18} weight="bold" />
                Create First Habit
              </Button>
            )}
          </div>
        ) : (
          /* Grouped Habit List */
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {groupedHabits.map(({ category, habits: catHabits }) => (
              <div key={category.id}>
                {/* Category Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-2)",
                    marginBottom: "var(--space-2)",
                    padding: "0 var(--space-1)",
                  }}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: category.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {category.name}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-disabled)" }}>
                    ({catHabits.length})
                  </span>
                </div>

                {/* Habits in category */}
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {catHabits.map((habit) => (
                    <Card key={habit.id} padding="md">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--space-3)",
                        }}
                      >
                        {/* Type icon */}
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--bg-tertiary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {habit.tracking_type === "boolean" ? (
                            <CheckCircle size={18} color="var(--accent-primary)" />
                          ) : (
                            <Timer size={18} color="var(--status-warning)" />
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--space-2)",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "15px",
                                fontWeight: 500,
                                opacity: habit.active ? 1 : 0.5,
                              }}
                            >
                              {habit.name}
                            </span>
                            {!habit.active && (
                              <Badge variant="neutral">Inactive</Badge>
                            )}
                          </div>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {habit.tracking_type === "boolean"
                              ? "Yes / No"
                              : `Target: ${habit.target_value} ${habit.unit || "min"}`}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", gap: "var(--space-1)" }}>
                          <button
                            onClick={() => toggleActive(habit)}
                            aria-label={habit.active ? "Deactivate" : "Activate"}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: habit.active ? "var(--accent-primary)" : "var(--text-disabled)",
                              padding: "var(--space-2)",
                              fontSize: "12px",
                              fontFamily: "inherit",
                              fontWeight: 500,
                            }}
                          >
                            {habit.active ? "ON" : "OFF"}
                          </button>
                          <button
                            onClick={() => openEditSheet(habit)}
                            aria-label={`Edit ${habit.name}`}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--text-muted)",
                              padding: "var(--space-2)",
                            }}
                          >
                            <PencilSimple size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(habit.id)}
                            aria-label={`Delete ${habit.name}`}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: "var(--status-error)",
                              padding: "var(--space-2)",
                            }}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Delete Confirmation */}
                      {deleteConfirm === habit.id && (
                        <div
                          style={{
                            marginTop: "var(--space-3)",
                            padding: "var(--space-3)",
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "var(--radius-sm)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "var(--space-2)",
                          }}
                        >
                          <span style={{ fontSize: "13px", color: "var(--status-error)" }}>
                            Delete this habit and all its entries?
                          </span>
                          <div style={{ display: "flex", gap: "var(--space-2)" }}>
                            <Button
                              variant="ghost"
                              onClick={() => setDeleteConfirm(null)}
                              style={{ height: "32px", padding: "0 var(--space-3)", fontSize: "12px" }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(habit.id)}
                              style={{ height: "32px", padding: "0 var(--space-3)", fontSize: "12px" }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Orphan habits */}
            {orphanHabits.length > 0 && (
              <div>
                <span style={{ fontSize: "13px", color: "var(--text-disabled)", marginBottom: "var(--space-2)", display: "block" }}>
                  Uncategorized
                </span>
                {orphanHabits.map((habit) => (
                  <Card key={habit.id} padding="sm">
                    <span style={{ fontSize: "14px" }}>{habit.name}</span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Edit Habit" : "New Habit"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Habit Name"
            placeholder="e.g. Drink water, Read 30 min, Meditate"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: undefined }));
            }}
            error={formErrors.name}
            autoFocus
          />

          {/* Category Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: formErrors.category_id ? "var(--status-error)" : "var(--text-muted)",
              }}
            >
              Category
            </label>
            <select
              value={form.category_id}
              onChange={(e) => {
                setForm((f) => ({ ...f, category_id: e.target.value }));
                if (formErrors.category_id) setFormErrors((prev) => ({ ...prev, category_id: undefined }));
              }}
              style={{
                height: "44px",
                padding: "0 var(--space-4)",
                backgroundColor: "var(--bg-primary)",
                border: `1px solid ${formErrors.category_id ? "var(--status-error)" : "var(--border-default)"}`,
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontFamily: "inherit",
                outline: "none",
                width: "100%",
                appearance: "none",
                cursor: "pointer",
              }}
            >
              <option value="" disabled>
                Select a category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {formErrors.category_id && (
              <span style={{ fontSize: "12px", color: "var(--status-error)" }}>
                {formErrors.category_id}
              </span>
            )}
          </div>

          {/* Tracking Type */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
              }}
            >
              Tracking Type
            </label>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              {([
                { value: "boolean", label: "Yes / No", icon: <CheckCircle size={18} /> },
                { value: "duration", label: "Duration / Value", icon: <Timer size={18} /> },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setForm((f) => ({ ...f, tracking_type: option.value }))}
                  type="button"
                  style={{
                    flex: 1,
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${
                      form.tracking_type === option.value
                        ? "var(--accent-primary)"
                        : "var(--border-default)"
                    }`,
                    backgroundColor:
                      form.tracking_type === option.value
                        ? "var(--accent-primary)" + "15"
                        : "var(--bg-primary)",
                    color:
                      form.tracking_type === option.value
                        ? "var(--accent-primary)"
                        : "var(--text-muted)",
                    fontSize: "13px",
                    fontWeight: 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                >
                  {option.icon}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target & Unit (only for duration type) */}
          {form.tracking_type === "duration" && (
            <div style={{ display: "flex", gap: "var(--space-3)" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Target Value"
                  type="number"
                  placeholder="30"
                  value={String(form.target_value)}
                  onChange={(e) => setForm((f) => ({ ...f, target_value: parseFloat(e.target.value) || 0 }))}
                  error={formErrors.target_value}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  label="Unit"
                  placeholder="e.g. min, pages, km"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Save */}
          <div style={{ marginTop: "var(--space-2)" }}>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              {editingId ? "Save Changes" : "Create Habit"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
