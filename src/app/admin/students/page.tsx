"use client";

import { useEffect, useState, useRef } from "react";
import { getStudents, getFaculties, getDepartments, getProgrammes, createStudent, updateStudent, deleteStudent, bulkCreateStudents } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface StudentRecord {
  id: string;
  student_id: string;
  department_id: string;
  faculty_id: string;
  programme_id: string | null;
  level: string;
  status: string;
  created_at: string;
  profile?: { id: string; full_name: string; email: string };
  department?: { id: string; name: string; code: string };
  faculty?: { id: string; name: string; code: string };
  programme?: { id: string; name: string; code: string };
}

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; faculty_id: string }
interface Programme { id: string; name: string; code: string; department_id: string }

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Single create state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    student_id: "",
    department_id: "",
    faculty_id: "",
    programme_id: "",
    level: "100",
    status: "active",
    profile_id: "",
  });

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created?: number; errors?: string[] } | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getStudents(), getFaculties(), getDepartments(), getProgrammes()])
      .then(([s, f, d, p]) => {
        setStudents(s);
        setFaculties(f);
        setDepartments(d);
        setProgrammes(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ full_name: "", email: "", student_id: "", department_id: "", faculty_id: "", programme_id: "", level: "100", status: "active", profile_id: "" });
    setShowModal(true);
  }

  function openEdit(student: StudentRecord) {
    setEditing(student);
    setForm({
      full_name: student.profile?.full_name || "",
      email: student.profile?.email || "",
      student_id: student.student_id,
      department_id: student.department_id,
      faculty_id: student.faculty_id,
      programme_id: student.programme_id || "",
      level: student.level,
      status: student.status,
      profile_id: student.profile?.id || "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("full_name", form.full_name);
    formData.set("email", form.email);
    formData.set("student_id", form.student_id);
    formData.set("department_id", form.department_id);
    formData.set("faculty_id", form.faculty_id);
    formData.set("programme_id", form.programme_id);
    formData.set("level", form.level);
    formData.set("status", form.status);
    formData.set("profile_id", form.profile_id);

    try {
      const result = editing
        ? await updateStudent(editing.id, formData)
        : await createStudent(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Student updated successfully" : "Student created successfully");
      setEditing(null);
      setShowModal(false);
      const data = await getStudents();
      setStudents(data);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  function downloadTemplate() {
    const csv = "full_name,email,student_id,faculty,department,programme,level\nJohn Smith,john@uni.edu,STU001,Faculty of Science,Computer Science,BSC-CSC,200\nJane Doe,jane@uni.edu,STU002,Faculty of Science,Mathematics,BSC-MTH,100";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "students_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleBulkUpload() {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkResult(null);

    try {
      const text = await bulkFile.text();
      const result = await bulkCreateStudents(text);
      setBulkResult(result);

      if (result.errors && result.errors.length === 0 && result.created) {
        toast.success(`${result.created} students created`);
        setShowBulkModal(false);
        setBulkFile(null);
        const data = await getStudents();
        setStudents(data);
      } else if (result.created && result.created > 0) {
        toast.warning(`${result.created} created, ${result.errors!.length} failed`);
        const data = await getStudents();
        setStudents(data);
      } else {
        toast.error("All rows failed");
      }
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setBulkUploading(false);
    }
  }

  async function handleDelete(id: string, profileId: string) {
    if (!confirm("Delete this student? This also removes the student's exam assignments, attempts, answers, results, and violations.")) return;
    const result = await deleteStudent(id, profileId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Student deleted");
    setStudents((prev) => prev.filter((student) => student.id !== id));
  }

  const filteredDepts = departments.filter(
    (d) => !filterFaculty || d.faculty_id === filterFaculty
  );

  const formDepts = departments.filter(
    (d) => !form.faculty_id || d.faculty_id === form.faculty_id
  );

  const filtered = students.filter((s) => {
    const nameMatch =
      s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(search.toLowerCase());
    const facultyMatch = !filterFaculty || s.faculty?.name === faculties.find((f) => f.id === filterFaculty)?.name;
    const deptMatch = !filterDept || s.department?.name === departments.find((d) => d.id === filterDept)?.name;
    return nameMatch && facultyMatch && deptMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Students</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">View all registered students across the institution</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setBulkResult(null); setBulkFile(null); setShowBulkModal(true); }}>Bulk Upload</Button>
          <Button onClick={openCreate}>Add Student</Button>
        </div>
      </div>

      <div className="flex gap-3 max-w-2xl">
        <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterFaculty} onChange={(e) => { setFilterFaculty(e.target.value); setFilterDept(""); }} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Faculties</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Departments</option>
          {filteredDepts.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Faculty</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{student.profile?.full_name || "—"}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{student.profile?.email || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{student.student_id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{student.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{student.faculty?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{student.level}</td>
                    <td className="px-4 py-3">
                      <Badge variant={student.status === "active" ? "success" : "default"}>{student.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(student)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(student.id, student.profile?.id || "")} className="text-sm text-red-600 hover:text-red-700">
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
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Student" : "Add Student"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@university.edu" required />
          <Input label="Student ID" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="e.g. STU001" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Faculty</label>
            <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: "", programme_id: "" })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
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
              {formDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Programme</label>
            <select value={form.programme_id} onChange={(e) => setForm({ ...form, programme_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">No programme</option>
              {programmes
                .filter((p) => p.department_id === form.department_id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
            </select>
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
      <Modal isOpen={showBulkModal} onClose={() => setShowBulkModal(false)} title="Bulk Upload Students">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Upload a CSV file with the following columns:
          </p>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-[var(--text-secondary)]">
            <div className="font-semibold text-[var(--text)] mb-1">Required: full_name, email, student_id, faculty, department</div>
            <div>Optional: programme, level (default 100)</div>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between mb-1">
              <p>Example CSV:</p>
              <button onClick={downloadTemplate} className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium">
                Download template
              </button>
            </div>
            <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{"full_name,email,student_id,faculty,department,programme,level\nJohn Smith,john@uni.edu,STU001,Faculty of Science,Computer Science,BSC-CSC,200\nJane Doe,jane@uni.edu,STU002,Faculty of Science,Mathematics,,100"}</pre>
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
