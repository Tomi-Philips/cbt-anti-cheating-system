"use client";

import { useEffect, useState } from "react";
import { getDepartments, getFaculties, getLecturers, getCourses, createCourse, updateCourse, deleteCourse, getAllocations, allocateLecturer, unallocateLecturer, syncCourseRegistrations } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; faculty_id: string; status: string }
interface Lecturer { id: string; staff_id: string; department_id: string; profile?: { full_name: string } }
interface Course { id: string; code: string; title: string; department_id: string; level: string; semester: string; credit_unit: number; academic_session: string; status: string; department?: { name: string } }
interface Allocation { course_id: string; lecturer_id: string; academic_session: string; semester: string; lecturer?: { profile?: { full_name: string } } }

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [allocatingCourse, setAllocatingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState({ code: "", title: "", department_id: "", level: "100", semester: "First", credit_unit: "3", academic_session: "2026/2027", status: "active" });
  const [allocForm, setAllocForm] = useState({ lecturer_id: "", academic_session: "2026/2027", semester: "First" });

  useEffect(() => {
    Promise.all([getDepartments(), getFaculties(), getLecturers(), getCourses(), getAllocations()])
      .then(([d, f, l, c, a]) => { setDepartments(d); setFaculties(f); setLecturers(l); setCourses(c); setAllocations(a); })
      .catch(() => toast.error("Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ code: "", title: "", department_id: "", level: "100", semester: "First", credit_unit: "3", academic_session: "2026/2027", status: "active" });
    setShowModal(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setForm({ code: course.code, title: course.title, department_id: course.department_id, level: course.level, semester: course.semester, credit_unit: String(course.credit_unit), academic_session: course.academic_session, status: course.status });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.set("code", form.code);
    formData.set("title", form.title);
    formData.set("department_id", form.department_id);
    formData.set("level", form.level);
    formData.set("semester", form.semester);
    formData.set("credit_unit", form.credit_unit);
    formData.set("academic_session", form.academic_session);
    formData.set("status", form.status);

    try {
      const result = editing ? await updateCourse(editing.id, formData) : await createCourse(formData);
      if (result.error) { toast.error(result.error); return; }
      toast.success(editing ? "Course updated" : "Course created");
      setShowModal(false);
      const [c, a] = await Promise.all([getCourses(), getAllocations()]);
      setCourses(c); setAllocations(a);
    } catch { toast.error("An error occurred"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this course? This also removes allocations and registrations.")) return;
    const result = await deleteCourse(id);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Course deleted");
    const [c, a] = await Promise.all([getCourses(), getAllocations()]);
    setCourses(c); setAllocations(a);
  }

  async function handleAllocate(e: React.FormEvent) {
    e.preventDefault();
    if (!allocatingCourse) return;
    const formData = new FormData();
    formData.set("course_id", allocatingCourse.id);
    formData.set("lecturer_id", allocForm.lecturer_id);
    formData.set("academic_session", allocForm.academic_session);
    formData.set("semester", allocForm.semester);

    const result = await allocateLecturer(formData);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Lecturer allocated");
    setAllocatingCourse(null);
    const a = await getAllocations();
    setAllocations(a);
  }

  async function handleUnallocate(alloc: Allocation) {
    if (!confirm("Remove this lecturer allocation?")) return;
    const result = await unallocateLecturer(alloc.course_id, alloc.lecturer_id, alloc.academic_session, alloc.semester);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Allocation removed");
    const a = await getAllocations();
    setAllocations(a);
  }

  async function handleSync(course: Course) {
    const result = await syncCourseRegistrations(course.id);
    if (result.error) { toast.error(result.error); return; }
    toast.success(`Synced ${result.inserted || 0} registrations`);
  }

  const levels = ["100", "200", "300", "400", "500", "600", "700", "800"];
  const semesters = ["First", "Second", "Third"];
  const sessions = ["2024/2025", "2025/2026", "2026/2027", "2027/2028"];
const formDepts = departments;
  const allocLecturers = lecturers.filter((l) => !allocatingCourse || l.department_id === allocatingCourse.department_id);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Courses</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage courses, levels, semesters and lecturer allocations</p>
        </div>
        <Button onClick={openCreate}>Add Course</Button>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Session</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Allocated Lecturers</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">No courses found</td></tr>
              ) : courses.map((course) => {
                const courseAllocs = allocations.filter((a) => a.course_id === course.id);
                return (
                  <tr key={course.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{course.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{course.title}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{course.level}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.semester}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.academic_session}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {courseAllocs.length === 0 ? "None" : courseAllocs.map((a) => a.lecturer?.profile?.full_name).join(", ")}
                    </td>
                    <td className="px-4 py-3"><Badge variant={course.status === "active" ? "success" : "default"}>{course.status}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => { setAllocatingCourse(course); setAllocForm({ lecturer_id: "", academic_session: course.academic_session, semester: course.semester }); }}>Allocate</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleSync(course)}>Sync</Button>
                        <button onClick={() => openEdit(course)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">Edit</button>
                        <button onClick={() => handleDelete(course.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {/* Create/Edit Course Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Course" : "Add Course"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Course Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSC 301" required />
          <Input label="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Database Management Systems" required />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Department</label>
            <select value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Department</option>
              {formDepts.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Level</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
                {levels.map((l) => (<option key={l} value={l}>Level {l}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
                {semesters.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credit Unit" type="number" value={form.credit_unit} onChange={(e) => setForm({ ...form, credit_unit: e.target.value })} min={1} max={10} required />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Academic Session</label>
              <select value={form.academic_session} onChange={(e) => setForm({ ...form, academic_session: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
                {sessions.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
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

      {/* Allocate Lecturer Modal */}
      <Modal isOpen={!!allocatingCourse} onClose={() => setAllocatingCourse(null)} title="Allocate Lecturer">
        <form onSubmit={handleAllocate} className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Allocate a lecturer to <strong>{allocatingCourse?.code} — {allocatingCourse?.title}</strong>
          </p>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Lecturer</label>
            <select value={allocForm.lecturer_id} onChange={(e) => setAllocForm({ ...allocForm, lecturer_id: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
              <option value="">Select Lecturer</option>
              {allocLecturers.map((l) => (
                <option key={l.id} value={l.id}>{l.profile?.full_name || l.staff_id} ({l.staff_id})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Academic Session</label>
              <select value={allocForm.academic_session} onChange={(e) => setAllocForm({ ...allocForm, academic_session: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
                {sessions.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-[var(--text)]">Semester</label>
              <select value={allocForm.semester} onChange={(e) => setAllocForm({ ...allocForm, semester: e.target.value })} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" required>
                {semesters.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAllocatingCourse(null)}>Cancel</Button>
            <Button type="submit" loading={saving}>Allocate</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
