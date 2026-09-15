"use client";

import { useEffect, useState } from "react";
import { getDepartments, getFaculties, getProgrammes, createProgramme, updateProgramme, deleteProgramme } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Department { id: string; name: string; code: string; faculty_id: string; status: string }
interface Faculty { id: string; name: string; code: string }
interface Programme { id: string; name: string; code: string; department_id: string; duration_years: number; status: string }

export default function ProgrammesPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Programme | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", department_id: "", duration_years: "4", status: "active" });

  useEffect(() => {
    Promise.all([getDepartments(), getFaculties(), getProgrammes()])
      .then(([d, f, p]) => { setDepartments(d); setFaculties(f); setProgrammes(p); })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", department_id: "", duration_years: "4", status: "active" });
    setShowModal(true);
  }

  function openEdit(prog: Programme) {
    setEditing(prog);
    setForm({ name: prog.name, code: prog.code, department_id: prog.department_id, duration_years: String(prog.duration_years), status: prog.status });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("code", form.code);
    formData.set("department_id", form.department_id);
    formData.set("duration_years", form.duration_years);
    formData.set("status", form.status);

    try {
      const result = editing ? await updateProgramme(editing.id, formData) : await createProgramme(formData);
      if (result.error) { toast.error(result.error); return; }
      toast.success(editing ? "Programme updated" : "Programme created");
      setShowModal(false);
      const data = await getProgrammes();
      setProgrammes(data);
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this programme?")) return;
    const result = await deleteProgramme(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Programme deleted");
    setProgrammes((prev) => prev.filter((p) => p.id !== id));
  }

  const formDepts = departments;
  const filteredDepts = departments;

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Programmes</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Degree programmes run by each department</p>
        </div>
        <Button onClick={openCreate}>Add Programme</Button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Programme</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : programmes.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">No programmes found</td></tr>
              ) : programmes.map((prog) => {
                const dept = departments.find((d) => d.id === prog.department_id);
                return (
                  <tr key={prog.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{prog.name}</td>
                    <td className="px-4 py-3 text-sm font-mono text-[var(--text-secondary)]">{prog.code}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{dept?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{prog.duration_years} yr</td>
                    <td className="px-4 py-3"><Badge variant={prog.status === "active" ? "success" : "default"}>{prog.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(prog)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">Edit</button>
                        <button onClick={() => handleDelete(prog.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Programme" : "Add Programme"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Programme Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. B.Sc. Computer Science" required />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. BSC-CSC" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Department</label>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <Input label="Duration (years)" type="number" value={form.duration_years} onChange={(e) => setForm({ ...form, duration_years: e.target.value })} min={1} max={8} required />
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
