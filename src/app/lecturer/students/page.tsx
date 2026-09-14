"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getStudents, createStudent } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface StudentRecord {
  id: string;
  student_id: string;
  level: string;
  status: string;
  created_at: string;
  profile?: { id: string; full_name: string; email: string };
  department?: { name: string };
  faculty?: { name: string };
}

export default function LecturerStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [lecturer, setLecturer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    student_id: "",
    level: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const lect = await getCurrentLecturer();
        setLecturer(lect);
        if (lect) {
          const data = await getStudents(lect.id);
          setStudents(data);
        }
      } catch {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("full_name", form.full_name);
    formData.set("email", form.email);
    formData.set("student_id", form.student_id);
    formData.set("level", form.level);
    formData.set("department_id", lecturer.department_id);
    formData.set("faculty_id", lecturer.faculty_id);
    formData.set("lecturer_id", lecturer.id);

    try {
      const result = await createStudent(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      setTempPassword(result.tempPassword || "");
      toast.success("Student created successfully");
      setShowModal(false);
      const data = await getStudents(lecturer.id);
      setStudents(data);
      setForm({ full_name: "", email: "", student_id: "", level: "" });
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const levels = ["100", "200", "300", "400", "500", "600", "700", "800"];
  const filtered = students.filter(
    (s) =>
      (s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterLevel || s.level === filterLevel)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Students</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage students under your academic supervision</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Student</Button>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Levels</option>
          {levels.map((l) => (
            <option key={l} value={l}>Level {l}</option>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No students found. Add students under your academic responsibility.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{student.profile?.full_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{student.student_id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{student.profile?.email || "—"}</td>
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

      {/* Temporary password display */}
      {tempPassword && (
        <Modal isOpen={!!tempPassword} onClose={() => setTempPassword("")} title="Student Created">
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-secondary)]">
              The student account has been created. Share this temporary password with the student:
            </p>
            <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-center">
              {tempPassword}
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              The student should change this password after first login.
            </p>
            <Button onClick={() => setTempPassword("")} className="w-full">Done</Button>
          </div>
        </Modal>
      )}

      {/* Create Student Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Doe" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="student@university.edu" required />
          <Input label="Student ID" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="e.g. STU2024001" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Level</label>
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Level</option>
              {levels.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
            The student will be assigned to your department ({lecturer?.department?.name}) and faculty ({lecturer?.faculty?.name}). A temporary password will be generated.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
