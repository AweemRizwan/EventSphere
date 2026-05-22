import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  useGetCategoriesQuery,
  useUpsertCategoryMutation,
  useDeleteCategoryMutation,
} from "@/store/api/eventsApi";
import { slugify } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useGetCategoriesQuery(false);
  const [upsertCategory, { isLoading: saving }] = useUpsertCategoryMutation();
  const [deleteCategory] = useDeleteCategoryMutation();
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setColor("#3B82F6");
    setIsActive(true);
  };

  const startEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setColor(c.color || "#3B82F6");
    setIsActive(c.is_active);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await upsertCategory({
        id: editing?.id,
        data: {
          name: name.trim(),
          slug: editing?.slug ?? slugify(name),
          color,
          is_active: isActive,
        },
      }).unwrap();
      toast.success(editing ? "Category updated" : "Category created");
      resetForm();
    } catch (e) {
      toast.error((e as Error).message || "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategory(id).unwrap();
      toast.success("Category deleted");
      if (editing?.id === id) resetForm();
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete");
    }
  };

  return (
    <div>
      <PageHeader title="Manage Categories" description="Platform event categories (Supabase + RLS)" />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editing ? "Edit category" : "New category"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Technology" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} id="cat-active" />
              <Label htmlFor="cat-active">Active</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Plus className="w-4 h-4 mr-1" />
                {editing ? "Update" : "Create"}
              </Button>
              {editing && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">All categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <LoadingSpinner className="py-8" />
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No categories yet.</p>
            ) : (
              <ul className="space-y-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg border hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-sm truncate">{c.name}</span>
                      {!c.is_active && (
                        <span className="text-xs text-muted-foreground">(inactive)</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleDelete(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
