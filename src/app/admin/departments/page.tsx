"use client";

import { useEffect, useState, useRef } from "react";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment, getFaculties, bulkCreateDepartments } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string;
  description: string | null;
  status: string;
  created_at: string;
  faculty?: { id: string; name: string; code: string };
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created?: number; errors?: string[] } | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    code: "",
    faculty_id: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    Promise.all([getDepartments(), getFaculties()])
      .then(([d, f]) => {
        setDepartments(d);
        setFaculties(f);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", code: "", faculty_id: "", description: "", status: "active" });
    setShowModal(true);
  }

  function openEdit(dept: Department) {
    setEditing(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      faculty_id: dept.faculty_id,
      description: dept.description || "",
      status: dept.status,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("code", form.code);
    formData.set("faculty_id", form.faculty_id);
    formData.set("description", form.description);
    formData.set("status", form.status);

    try {
      const result = editing
        ? await updateDepartment(editing.id, formData)
        : await createDepartment(formData);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editing ? "Department updated" : "Department created");
      setShowModal(false);
      const data = await getDepartments();
      setDepartments(data);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this department?")) return;
    const result = await deleteDepartment(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Department deleted");
    setDepartments((prev) => prev.filter((d) => d.id !== id));
  }

  function downloadTemplate() {
    const csv = "name,code,faculty,description,status\nComputer Science,CSC,Faculty of Science,Computer Science Department,active\nMathematics,MTH,Faculty of Science,Mathematics Department,active";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "departments_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkUpload() {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);

    try {
      const text = await bulkFile.text();
      const result = await bulkCreateDepartments(text);
      setBulkResult(result);

      if (result.errors && result.errors.length === 0 && result.created) {
        toast.success(`${result.created} departments created`);
        setShowBulkModal(false);
        setBulkFile(null);
        const data = await getDepartments();
        setDepartments(data);
      } else if (result.created && result.created > 0) {
        toast.warning(`${result.created} created, ${result.errors!.length} failed`);
        const data = await getDepartments();
        setDepartments(data);
      } else {
        toast.error("All rows failed");
      }
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setBulkUploading(false);
    }
  }

  const filtered = departments.filter(
    (d) =>
      (d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.code.toLowerCase().includes(search.toLowerCase())) &&
      (!filterFaculty || d.faculty_id === filterFaculty)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Departments</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage academic departments
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setBulkResult(null); setBulkFile(null); setShowBulkModal(true); }}>Bulk Upload</Button>
          <Button onClick={openCreate}>Add Department</Button>
        </div>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input
          type="text"
          placeholder="Search departments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
        <select
          value={filterFaculty}
          onChange={(e) => setFilterFaculty(e.target.value)}
          className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        >
          <option value="">All Faculties</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Faculty</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No departments found
                  </td>
                </tr>
              ) : (
                filtered.map((dept) => (
                  <tr key={dept.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{dept.name}</div>
                      {dept.description && (
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">{dept.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3"><span className="text-sm font-mono">{dept.code}</span></td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{dept.faculty?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={dept.status === "active" ? "success" : "default"}>{dept.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(dept)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">Edit</button>
                        <button onClick={() => handleDelete(dept.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Single create/edit modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Department" : "Add Department"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" required />
          <Input label="Department Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSC" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Faculty</label>
            <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Faculty</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
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

      {/* Bulk upload modal */}
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Upload Departments">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Upload a CSV file with the following columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text)] mb-1">Required: name, code, faculty</div>
            <div>Optional: description, status</div>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between mb-1">
              <p>Example CSV:</p>
              <button onClick={downloadTemplate} className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium">
                Download template
              </button>
            </div>
            <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{"name,code,faculty,description\nComputer Science,CSC,Faculty of Science,CS dept\nMathematics,MTH,Faculty of Science,"}</pre>
          </div>

          <div className="border-2 border-dashed border-[var(--border)] rounded-lg p-6 text-center">
            <input
              ref={bulkFileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
            />
            {bulkFile ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-[var(--text)]">{bulkFile.name}</p>
                <p className="text-xs text-[var(--text-secondary)]">{(bulkFile.size / 1024).toFixed(1)} KB</p>
                <Button variant="ghost" size="sm" onClick={() => { setBulkFile(null); setBulkResult(null); if (bulkFileRef.current) bulkFileRef.current.value = ""; }}>Remove</Button>
              </div>
            ) : (
              <button onClick={() => bulkFileRef.current?.click()} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">
                Click to select CSV file
              </button>
            )}
          </div>

          {bulkResult && bulkResult.errors && bulkResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-red-700 mb-2">Errors ({bulkResult.errors.length}):</p>
              <ul className="text-xs text-red-600 space-y-1">
                {bulkResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button loading={bulkUploading} disabled={!bulkFile} onClick={handleBulkUpload}>Upload</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
