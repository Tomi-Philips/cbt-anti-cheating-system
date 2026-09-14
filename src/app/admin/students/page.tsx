"use client";

import { useEffect, useState, useRef } from "react";
import { getStudents, getFaculties, getDepartments, getLecturers, createStudent, bulkCreateStudents } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface StudentRecord {
  id: string;
  student_id: string;
  level: string;
  status: string;
  created_at: string;
  profile?: { id: string; full_name: string; email: string };
  department?: { id: string; name: string; code: string };
  faculty?: { id: string; name: string; code: string };
}

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; faculty_id: string }
interface Lecturer {
  id: string;
  staff_id: string;
  profile?: { full_name: string };
}

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterFaculty, setFilterFaculty] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // Single create state
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    student_id: "",
    department_id: "",
    faculty_id: "",
    lecturer_id: "",
    level: "100",
  });

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created?: number; errors?: string[] } | null>(null);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([getStudents(), getFaculties(), getDepartments(), getLecturers()])
      .then(([s, f, d, l]) => {
        setStudents(s);
        setFaculties(f);
        setDepartments(d);
        setLecturers(l);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setForm({ full_name: "", email: "", student_id: "", department_id: "", faculty_id: "", lecturer_id: "", level: "100" });
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
    formData.set("lecturer_id", form.lecturer_id);
    formData.set("level", form.level);

    try {
      const result = await createStudent(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Student created successfully");
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
    const csv = "full_name,email,student_id,faculty,department,lecturer_staff_id,level\nJohn Smith,john@uni.edu,STU001,Faculty of Science,Computer Science,STL001,200\nJane Doe,jane@uni.edu,STU002,Faculty of Science,Mathematics,STL002,100";
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
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Single create modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@university.edu" required />
          <Input label="Student ID" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="e.g. STU001" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Faculty</label>
            <select value={form.faculty_id} onChange={(e) => setForm({ ...form, faculty_id: e.target.value, department_id: "", lecturer_id: "" })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
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
            <label className="block text-sm font-medium text-[var(--text)]">Supervising Lecturer</label>
            <select value={form.lecturer_id} onChange={(e) => setForm({ ...form, lecturer_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Lecturer</option>
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>{l.profile?.full_name || l.staff_id}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Level</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
              <option value="500">500 Level</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
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
            <div className="font-semibold text-[var(--text)] mb-1">Required: full_name, email, student_id, faculty, department, lecturer_staff_id</div>
            <div>Optional: level (default 100)</div>
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            <div className="flex items-center justify-between mb-1">
              <p>Example CSV:</p>
              <button onClick={downloadTemplate} className="text-[var(--primary)] hover:text-[var(--primary-dark)] font-medium">
                Download template
              </button>
            </div>
            <pre className="bg-gray-50 rounded p-2 overflow-x-auto">{"full_name,email,student_id,faculty,department,lecturer_staff_id,level\nJohn Smith,john@uni.edu,STU001,Faculty of Science,Computer Science,STL001,200\nJane Doe,jane@uni.edu,STU002,Faculty of Science,Mathematics,STL002,100"}</pre>
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
