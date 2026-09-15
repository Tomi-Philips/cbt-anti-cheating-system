"use client";

import { useEffect, useState } from "react";
import { getFaculties, createFaculty, updateFaculty, deleteFaculty } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Faculty { id: string; name: string; code: string; description: string | null; status: string; created_at: string }

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", status: "active" });

  useEffect(() => {
    loadFaculties();
  }, []);

  async function loadFaculties() {
    try {
      const data = await getFaculties();
      setFaculties(data);
    } catch { toast.error("Failed to load faculties"); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", description: "", status: "active" });
    setShowModal(true);
  }

  function openEdit(faculty: Faculty) {
    setEditing(faculty);
    setForm({ name: faculty.name, code: faculty.code, description: faculty.description || "", status: faculty.status });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("code", form.code);
    formData.set("description", form.description);
    formData.set("status", form.status);

    try {
      const result = editing ? await updateFaculty(editing.id, formData) : await createFaculty(formData);
      if (result.error) { toast.error(result.error); return; }
      toast.success(editing ? "Faculty updated" : "Faculty created");
      setShowModal(false);
      loadFaculties();
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this faculty? Departments inside it will be set to null.")) return;
    const result = await deleteFaculty(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Faculty deleted");
    loadFaculties();
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Faculties</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage academic faculties</p>
        </div>
        <Button onClick={openCreate}>Add Faculty</Button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : faculties.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">No faculties found</td></tr>
              ) : faculties.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{faculty.name}</td>
                  <td className="px-4 py-3 text-sm font-mono text-[var(--text-secondary)]">{faculty.code}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{faculty.description || "—"}</td>
                  <td className="px-4 py-3"><Badge variant={faculty.status === "active" ? "success" : "default"}>{faculty.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(faculty)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">Edit</button>
                      <button onClick={() => handleDelete(faculty.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Faculty" : "Add Faculty"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Faculty Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Faculty of Computing & Informatics" required />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. FCI" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none" rows={3} placeholder="Optional description" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? "Update" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}