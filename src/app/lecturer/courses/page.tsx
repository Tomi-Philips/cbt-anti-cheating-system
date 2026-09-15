"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getAllocations } from "@/lib/actions";
import { Card, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface CourseRecord {
  id: string;
  code: string;
  title: string;
  status: string;
  level: string;
  semester: string;
  credit_unit: number;
  academic_session: string;
  created_at: string;
  department?: { name: string };
}

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const lect = await getCurrentLecturer();
        if (lect) {
          const data = await getAllocations(lect.id);
          const courses = (data || [])
            .map((a: { course?: CourseRecord }) => a.course)
            .filter((c): c is CourseRecord => !!c);
          setCourses(courses);
        }
      } catch {
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <p className="text-sm text-[var(--text-secondary)] mt-1">Courses you have been allocated to teach</p>
        </div>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Semester</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Session</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No courses found
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium">{course.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[var(--text)]">{course.title}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.department?.name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{course.level}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.semester}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{course.academic_session}</td>
                    <td className="px-4 py-3">
                      <Badge variant={course.status === "active" ? "success" : "default"}>{course.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
