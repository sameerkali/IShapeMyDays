"use client";

import { useState, useEffect, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  PlusCircle, PencilSimple, Trash,
  Heart, Star, Lightning, BookOpen, Barbell,
  Brain, Coffee, Moon, SunDim, Drop,
  MusicNote, Code, PencilLine, Leaf, Dog,
  Briefcase, Users, Target, Trophy, Flame,
  WarningCircle, FolderOpen,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Category } from "@/lib/types/database";
import { fetchCategoriesPageData, actionSaveCategory, actionDeleteCategory } from "@/lib/server/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
  Heart, Star, Lightning, BookOpen, Barbell,
  Brain, Coffee, Moon, Sun: SunDim, Drop,
  Music: MusicNote, Code, Pencil: PencilLine, Leaf, Dog,
  Briefcase, Users, Target, Trophy, Flame,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);

const COLOR_OPTIONS = [
  "#f5f5f5", "#a8a8a8", "#525252", "#ffffff",
  "#f87171", "#fb923c", "#facc15", "#4ade80",
  "#60a5fa", "#c084fc",
];

type CategoryFormData = { name: string; icon: string; color: string; order: number; };
const defaultForm: CategoryFormData = { name: "", icon: "Star", color: "#f5f5f5", order: 0 };

function CategoryIcon({ name, size = 18, color }: { name: string; size?: number; color?: string }) {
  const IconComp = ICON_MAP[name] || Star;
  return <IconComp size={size} weight="bold" color={color} />;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [habitCounts, setHabitCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(defaultForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await fetchCategoriesPageData();
      setCategories(data.categories);
      const counts: Record<string, number> = {};
      data.habits.forEach((h: { category_id: string }) => { counts[h.category_id] = (counts[h.category_id] || 0) + 1; });
      setHabitCounts(counts);
    } catch { toast.error("Failed to load categories"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreateSheet = () => { setEditingId(null); setForm({ ...defaultForm, order: categories.length }); setFormError(""); setSheetOpen(true); };
  const openEditSheet = (cat: Category) => {
    const hasHabits = (habitCounts[cat.id] || 0) > 0;
    if (hasHabits) { toast.error(`"${cat.name}" has ${habitCounts[cat.id]} habit(s) — cannot edit.`); return; }
    setEditingId(cat.id);
    setForm({ name: cat.name, icon: cat.icon, color: cat.color, order: cat.order });
    setFormError(""); setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Name is required"); return; }
    setIsSaving(true);
    try {
      await actionSaveCategory({ name: form.name.trim(), icon: form.icon, color: form.color, order: form.order, active: true }, editingId);
      toast.success(editingId ? "Category updated" : "Category created");
      setSheetOpen(false); fetchCategories();
    } catch { toast.error("Failed to save"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await actionDeleteCategory(id);
      toast.success("Deleted"); setDeleteConfirm(null); fetchCategories();
    } catch { toast.error("Failed to delete"); }
  };

  const toggleActive = async (cat: Category) => {
    try {
      await actionSaveCategory({ name: cat.name, icon: cat.icon, color: cat.color, order: cat.order, active: !cat.active }, cat.id);
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, active: !c.active } : c));
    } catch { toast.error("Failed to update"); }
  };

  return (
    <>
      <TopBar
        title="Categories"
        rightAction={
          <button
            onClick={openCreateSheet}
            aria-label="Add category"
            style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-primary)", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font)" }}
          >
            <PlusCircle size={18} weight="bold" /> Add
          </button>
        }
      />

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 16px" }}>
            <FolderOpen size={32} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
            <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>No categories yet</p>
            <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "24px" }}>Organize your habits with categories.</p>
            <Button onClick={openCreateSheet}><PlusCircle size={16} weight="bold" /> Create First Category</Button>
          </div>
        ) : (
          <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {categories.map((cat, idx) => {
              const catHabitCount = habitCounts[cat.id] || 0;
              const hasHabits = catHabitCount > 0;

              return (
                <div key={cat.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "14px 16px",
                      backgroundColor: "var(--bg-surface)",
                      borderBottom: (idx < categories.length - 1 || deleteConfirm === cat.id) ? "1px solid var(--border)" : "none",
                      opacity: cat.active ? 1 : 0.5,
                    }}
                  >
                    {/* Color+Icon */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: cat.color + "22",
                        border: `1px solid ${cat.color}44`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CategoryIcon name={cat.icon} size={17} color={cat.color} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600 }}>{cat.name}</span>
                        <Badge variant={cat.active ? "neutral" : "neutral"} style={{ cursor: "pointer" }} onClick={() => toggleActive(cat)}>
                          {cat.active ? "Active" : "Off"}
                        </Badge>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {catHabitCount > 0 ? `${catHabitCount} habit${catHabitCount > 1 ? "s" : ""}` : "No habits"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => openEditSheet(cat)}
                        aria-label={`Edit ${cat.name}`}
                        style={{ background: "none", border: "none", cursor: hasHabits ? "not-allowed" : "pointer", color: hasHabits ? "var(--text-disabled)" : "var(--text-muted)", padding: "6px", display: "flex", alignItems: "center", opacity: hasHabits ? 0.3 : 1 }}
                      >
                        <PencilSimple size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(cat.id)}
                        aria-label={`Delete ${cat.name}`}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-error)", padding: "6px", display: "flex", alignItems: "center" }}
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirm */}
                  {deleteConfirm === cat.id && (
                    <div style={{ padding: "12px 16px", backgroundColor: "var(--bg-elevated)", borderBottom: idx < categories.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "12px" }}>
                        <WarningCircle size={15} weight="bold" color="var(--status-error)" style={{ flexShrink: 0, marginTop: "1px" }} />
                        <div>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--status-error)" }}>Delete &ldquo;{cat.name}&rdquo;?</span>
                          {hasHabits && (
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", lineHeight: 1.5 }}>
                              Also deletes {catHabitCount} habit{catHabitCount > 1 ? "s" : ""} and all entries. Cannot be undone.
                            </p>
                          )}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                        <Button variant="ghost" onClick={() => setDeleteConfirm(null)} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}>Cancel</Button>
                        <Button variant="danger" onClick={() => handleDelete(cat.id)} style={{ height: "32px", padding: "0 12px", fontSize: "12px" }}>Delete</Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <BottomSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} title={editingId ? "Edit Category" : "New Category"}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <Input label="Category Name" placeholder="e.g. Health, Learning, Work" value={form.name} onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); if (formError) setFormError(""); }} error={formError} autoFocus />

          {/* Icon Picker */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>Icon</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  type="button"
                  aria-label={icon}
                  style={{
                    height: "44px",
                    borderRadius: "var(--radius-sm)",
                    border: `1px solid ${form.icon === icon ? "var(--white)" : "var(--border-strong)"}`,
                    backgroundColor: form.icon === icon ? "var(--bg-elevated)" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--t-fast)",
                  }}
                >
                  <CategoryIcon name={icon} size={18} color={form.icon === icon ? "var(--white)" : "var(--text-muted)"} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "8px" }}>Color</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  type="button"
                  aria-label={`Color ${color}`}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: color,
                    border: form.color === color ? "2px solid var(--white)" : "2px solid transparent",
                    outline: form.color === color ? "1px solid var(--border-strong)" : "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    transition: "border var(--t-fast)",
                  }}
                />
              ))}
            </div>
          </div>

          <Input label="Display Order" type="number" value={String(form.order)} onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))} />
          <Button variant="primary" fullWidth onClick={handleSave} isLoading={isSaving}>
            {editingId ? "Save Changes" : "Create Category"}
          </Button>
        </div>
      </BottomSheet>
    </>
  );
}
