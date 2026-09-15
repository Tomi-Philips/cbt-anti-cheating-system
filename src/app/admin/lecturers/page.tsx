"use client";

import { useEffect, useState, useRef } from "react";
import { getLecturers, createLecturer, updateLecturer, deleteLecturer, getFaculties, getDepartments, bulkCreateLecturers } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface LecturerRecord {
  id: string;
  staff_id: string;
  department_id: string;
  faculty_id: string;
  status: string;
  created_at: string;
  profile?: { id: string; full_name: string; email: string; status: string };
  department?: { id: string; name: string; code: string };
  faculty?: { id: string; name: string; code: string };
}

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; faculty_id: string }

export default function LecturersPage() {
  const [lecturers, setLecturers] = useState<LecturerRecord[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LecturerRecord | null>(null);
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
    full_name: "",
    email: "",
    staff_id: "",
    department_id: "",
    faculty_id: "",
    password: "",
    status: "active",
    profile_id: "",
  });

  useEffect(() => {
    Promise.all([getLecturers(), getFaculties(), getDepartments()])
      .then(([l, f, d]) => {
        setLecturers(l);
        setFaculties(f);
        setDepartments(d);
      })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ full_name: "", email: "", staff_id: "", department_id: "", faculty_id: "", password: "", status: "active", profile_id: "" });
    setShowModal(true);
  }

  function openEdit(lecturer: LecturerRecord) {
    setEditing(lecturer);
    setForm({
      full_name: lecturer.profile?.full_name || "",
      email: lecturer.profile?.email || "",
      staff_id: lecturer.staff_id,
      department_id: lecturer.department_id,
      faculty_id: lecturer.faculty_id,
      password: "",
      status: lecturer.status,
      profile_id: lecturer.profile?.id || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("full_name", form.full_name);
    formData.set("email", form.email);
    formData.set("staff_id", form.staff_id);
    formData.set("department_id", form.department_id);
    formData.set("faculty_id", form.faculty_id);
    formData.set("password", form.password);
    formData.set("status", form.status);
    formData.set("profile_id", form.profile_id);

    try {
      const result = editing
        ? await updateLecturer(editing.id, formData)
        : await createLecturer(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Lecturer updated successfully" : "Lecturer created successfully");
      setEditing(null);
      setShowModal(false);
      const data = await getLecturers();
      setLecturers(data);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, profileId: string) {
    if (!confirm("Are you sure you want to delete this lecturer?")) return;
    const result = await deleteLecturer(id, profileId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Lecturer deleted");
    setLecturers((prev) => prev.filter((l) => l.id !== id));
  }

  function downloadTemplate() {
    const csv = "full_name,email,staff_id,faculty,department,password\nDr. John Smith,john@uni.edu,STL001,Faculty of Science,Computer Science,\nJane Doe,jane@uni.edu,STL002,Faculty of Science,Mathematics,";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lecturers_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkUpload() {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);

    try {
      const text = await bulkFile.text();
      const result = await bulkCreateLecturers(text);
      setBulkResult(result);

      if (result.errors && result.errors.length === 0 && result.created) {
        toast.success(`${result.created} lecturers created`);
        setShowBulkModal(false);
        setBulkFile(null);
        const data = await getLecturers();
        setLecturers(data);
      } else if (result.created && result.created > 0) {
        toast.warning(`${result.created} created, ${result.errors!.length} failed`);
        const data = await getLecturers();
        setLecturers(data);
      } else {
        toast.error("All rows failed");
      }
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setBulkUploading(false);
    }
  }

  const filteredDepartments = departments.filter(
    (d) => !form.faculty_id || d.faculty_id === form.faculty_id
  );

  const filtered = lecturers.filter((l) => {
    const nameMatch = l.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.staff_id?.toLowerCase().includes(search.toLowerCase());
    const facultyMatch = !filterFaculty || l.faculty_id === filterFaculty;
    return nameMatch && facultyMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Lecturers</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage lecturer accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setBulkResult(null); setBulkFile(null); setShowBulkModal(true); }}>Bulk Upload</Button>
          <Button onClick={openCreate}>Add Lecturer</Button>
        </div>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search lecturers..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterFaculty} onChange={(e) => setFilterFaculty(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Faculties</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Staff ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Faculty</th>
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No lecturers found
                  </td>
                </tr>
              ) : (
                filtered.map((lect) => (
                  <tr key={lect.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{lect.profile?.full_name || "—"}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{lect.profile?.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{lect.staff_id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{lect.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{lect.faculty?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={lect.status === "active" ? "success" : "default"}>{lect.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(lect)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(lect.id, lect.profile?.id || "")} className="text-sm text-red-600 hover:text-red-700">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Single create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Lecturer" : "Add Lecturer"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. Dr. John Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="lecturer@university.edu" required />
          <Input label="Staff ID" value={form.staff_id} onChange={(e) => setForm({ ...form, staff_id: e.target.value })} placeholder="e.g. STL001" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Faculty</label>
            <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: "" })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Faculty</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Department</label>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Department</option>
              {filteredDepartments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? "Leave blank to keep current password" : "Minimum 6 characters"} required={!editing} minLength={editing ? undefined : 6} />
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
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Upload Lecturers">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Upload a CSV file with the following columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text)] mb-1">Required: full_name, email, staff_id, faculty, department</div>
            <div>Optional: password (auto-generated if empty)</div>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between mb-1">
              <p>Example CSV:</p>
              <button onClick={downloadTemplate} className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium">
                Download template
              </button>
            </div>
            <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{"full_name,email,staff_id,faculty,department\nDr. John Smith,john@uni.edu,STL001,Faculty of Science,Computer Science\nJane Doe,jane@uni.edu,STL002,Faculty of Science,Mathematics"}</pre>
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
