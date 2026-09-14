"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getCourses, createCourse, deleteCourse } from "@/lib/actions";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface CourseRecord {
  id: string;
  code: string;
  title: string;
  status: string;
  created_at: string;
  department?: { name: string };
}

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [lecturer, setLecturer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({ code: "", title: "" });

  useEffect(() => {
    async function load() {
      try {
        const lect = await getCurrentLecturer();
        setLecturer(lect);
        if (lect) {
          const data = await getCourses(lect.id);
          setCourses(data);
        }
      } catch {
        toast.error("Failed to load courses");
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
    formData.set("code", form.code);
    formData.set("title", form.title);
    formData.set("department_id", lecturer.department_id);
    formData.set("lecturer_id", lecturer.id);

    try {
      const result = await createCourse(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Course created");
      setShowModal(false);
      setForm({ code: "", title: "" });
      const data = await getCourses(lecturer.id);
      setCourses(data);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this course?")) return;
    const result = await deleteCourse(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Course deleted");
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  const filtered = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Courses</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your courses</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Course</Button>
      </div>

      <div className="max-w-sm">
        <input type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
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
                    No courses found
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{course.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{course.title}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.department?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={course.status === "active" ? "success" : "default"}>{course.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(course.id)} className="text-sm text-red-600 hover:text-red-700">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Course">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Course Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CSC 301" required />
          <Input label="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Database Management Systems" required />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
