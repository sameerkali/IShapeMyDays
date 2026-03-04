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
import { PlusCircle, PencilSimple, Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import type { Category } from "@/lib/types/database";

// Phosphor icon subset for categories
const ICON_OPTIONS = [
  "Heart", "Star", "Lightning", "BookOpen", "Barbell",
  "Brain", "Coffee", "Moon", "Sun", "Drop",
  "Music", "Code", "Pencil", "Leaf", "Dog",
  "Briefcase", "Users", "Target", "Trophy", "Flame",
] as const;

// Color palette for categories
const COLOR_OPTIONS = [
  "#10B981", "#22C55E", "#3B82F6", "#F59E0B", "#EF4444",
  "#EC4899", "#8B5CF6", "#06B6D4", "#F97316", "#94A3B8",
];

type CategoryFormData = {
  name: string;
  icon: string;
  color: string;
  order: number;
};

const defaultForm: CategoryFormData = {
  name: "",
  icon: "Star",
  color: "#10B981",
  order: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryFormData>(defaultForm);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const fetchCategories = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("order", { ascending: true });

    if (error) {
      toast.error("Failed to load categories");
      return;
    }

    setCategories(data || []);
    setIsLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateSheet = () => {
    setEditingId(null);
    setForm({ ...defaultForm, order: categories.length });
    setFormError("");
    setSheetOpen(true);
  };

  const openEditSheet = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      order: cat.order,
    });
    setFormError("");
    setSheetOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Category name is required");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("categories")
          .update({
            name: form.name.trim(),
            icon: form.icon,
            color: form.color,
            order: form.order,
          })
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Category updated");
      } else {
        // Create
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("categories").insert({
          user_id: user.id,
          name: form.name.trim(),
          icon: form.icon,
          color: form.color,
          order: form.order,
          active: true,
        });

        if (error) throw error;
        toast.success("Category created");
      }

      setSheetOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Category deleted");
      setDeleteConfirm(null);
      fetchCategories();
    } catch {
      toast.error("Failed to delete. Remove habits in this category first.");
    }
  };

  const toggleActive = async (cat: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ active: !cat.active })
      .eq("id", cat.id);

    if (error) {
      toast.error("Failed to update");
      return;
    }

    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, active: !c.active } : c))
    );
  };

  return (
    <>
      <TopBar
        title="Categories"
        rightAction={
          <button
            onClick={openCreateSheet}
            aria-label="Add category"
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
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-muted)" }}>
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          /* Empty State */
          <div
            style={{
              textAlign: "center",
              padding: "var(--space-10) var(--space-4)",
            }}
          >
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
              📂
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "var(--space-2)" }}>
              No categories yet
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "var(--space-6)" }}>
              Create categories to organize your habits.
            </p>
            <Button onClick={openCreateSheet}>
              <PlusCircle size={18} weight="bold" />
              Create First Category
            </Button>
          </div>
        ) : (
          /* Category List */
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {categories.map((cat) => (
              <Card key={cat.id} padding="md">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                  }}
                >
                  {/* Color dot + icon */}
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: cat.color + "20",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ color: cat.color }}>
                      {cat.icon === "Heart" ? "❤️" :
                       cat.icon === "Star" ? "⭐" :
                       cat.icon === "Lightning" ? "⚡" :
                       cat.icon === "BookOpen" ? "📖" :
                       cat.icon === "Barbell" ? "🏋️" :
                       cat.icon === "Brain" ? "🧠" :
                       cat.icon === "Coffee" ? "☕" :
                       cat.icon === "Moon" ? "🌙" :
                       cat.icon === "Sun" ? "☀️" :
                       cat.icon === "Drop" ? "💧" :
                       cat.icon === "Music" ? "🎵" :
                       cat.icon === "Code" ? "💻" :
                       cat.icon === "Pencil" ? "✏️" :
                       cat.icon === "Leaf" ? "🍃" :
                       cat.icon === "Dog" ? "🐕" :
                       cat.icon === "Briefcase" ? "💼" :
                       cat.icon === "Users" ? "👥" :
                       cat.icon === "Target" ? "🎯" :
                       cat.icon === "Trophy" ? "🏆" :
                       cat.icon === "Flame" ? "🔥" : "⭐"}
                    </span>
                  </div>

                  {/* Name + badge */}
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
                          fontWeight: 600,
                          opacity: cat.active ? 1 : 0.5,
                        }}
                      >
                        {cat.name}
                      </span>
                      <Badge
                        variant={cat.active ? "success" : "neutral"}
                        onClick={() => toggleActive(cat)}
                        style={{ cursor: "pointer" }}
                      >
                        {cat.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                      }}
                    >
                      Order: {cat.order}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "var(--space-2)" }}>
                    <button
                      onClick={() => openEditSheet(cat)}
                      aria-label={`Edit ${cat.name}`}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                        padding: "var(--space-2)",
                      }}
                    >
                      <PencilSimple size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      aria-label={`Delete ${cat.name}`}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--status-error)",
                        padding: "var(--space-2)",
                      }}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </div>

                {/* Delete Confirmation */}
                {deleteConfirm === cat.id && (
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
                      Delete this category?
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
                        onClick={() => handleDelete(cat.id)}
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
        )}
      </div>

      {/* Create/Edit Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editingId ? "Edit Category" : "New Category"}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <Input
            label="Category Name"
            placeholder="e.g. Health, Productivity, Learning"
            value={form.name}
            onChange={(e) => {
              setForm((f) => ({ ...f, name: e.target.value }));
              if (formError) setFormError("");
            }}
            error={formError}
            autoFocus
          />

          {/* Icon Picker */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "var(--space-2)",
              }}
            >
              Icon
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "var(--space-2)",
              }}
            >
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setForm((f) => ({ ...f, icon }))}
                  style={{
                    height: "44px",
                    borderRadius: "var(--radius-sm)",
                    border: `2px solid ${
                      form.icon === icon ? "var(--accent-primary)" : "var(--border-default)"
                    }`,
                    backgroundColor:
                      form.icon === icon ? "var(--accent-primary)" + "15" : "var(--bg-primary)",
                    cursor: "pointer",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all var(--transition-fast)",
                  }}
                  type="button"
                  aria-label={icon}
                >
                  {icon === "Heart" ? "❤️" :
                   icon === "Star" ? "⭐" :
                   icon === "Lightning" ? "⚡" :
                   icon === "BookOpen" ? "📖" :
                   icon === "Barbell" ? "🏋️" :
                   icon === "Brain" ? "🧠" :
                   icon === "Coffee" ? "☕" :
                   icon === "Moon" ? "🌙" :
                   icon === "Sun" ? "☀️" :
                   icon === "Drop" ? "💧" :
                   icon === "Music" ? "🎵" :
                   icon === "Code" ? "💻" :
                   icon === "Pencil" ? "✏️" :
                   icon === "Leaf" ? "🍃" :
                   icon === "Dog" ? "🐕" :
                   icon === "Briefcase" ? "💼" :
                   icon === "Users" ? "👥" :
                   icon === "Target" ? "🎯" :
                   icon === "Trophy" ? "🏆" :
                   icon === "Flame" ? "🔥" : "⭐"}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label
              style={{
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-muted)",
                display: "block",
                marginBottom: "var(--space-2)",
              }}
            >
              Color
            </label>
            <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    border: `3px solid ${
                      form.color === color ? "#fff" : "transparent"
                    }`,
                    outline:
                      form.color === color
                        ? `2px solid ${color}`
                        : "none",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  type="button"
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Order */}
          <Input
            label="Display Order"
            type="number"
            value={String(form.order)}
            onChange={(e) => setForm((f) => ({ ...f, order: parseInt(e.target.value) || 0 }))}
          />

          {/* Save Button */}
          <div style={{ marginTop: "var(--space-2)" }}>
            <Button
              variant="primary"
              fullWidth
              onClick={handleSave}
              isLoading={isSaving}
            >
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
