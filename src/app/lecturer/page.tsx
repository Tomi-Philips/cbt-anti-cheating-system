"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getStudents, getCourses, getExams } from "@/lib/actions";

export default function LecturerDashboard() {
  const [stats, setStats] = useState({
    total_students: 0,
    total_courses: 0,
    active_exams: 0,
    total_exams: 0,
  });
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const lecturer = await getCurrentLecturer();
        if (!lecturer) return;

        const [students, courses, exams] = await Promise.all([
          getStudents(lecturer.id),
          getCourses(lecturer.id),
          getExams(lecturer.id),
        ]);

        setStats({
          total_students: students.length,
          total_courses: courses.length,
          active_exams: exams.filter((e) => e.status === "active" || e.status === "published").length,
          total_exams: exams.length,
        });

        setRecentExams(exams.slice(0, 5));
      } catch {
        console.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards = [
    { label: "My Students", value: stats.total_students, color: "var(--student-color)" },
    { label: "My Courses", value: stats.total_courses, color: "var(--primary)" },
    { label: "Active Exams", value: stats.active_exams, color: "var(--warning)" },
    { label: "Total Exams", value: stats.total_exams, color: "#7c3aed" },
  ];

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
    published: "bg-green-50 text-green-700 border border-green-200",
    active: "bg-amber-50 text-amber-700 border border-amber-200",
    completed: "bg-gray-50 text-gray-600 border border-gray-200",
    closed: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Lecturer Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Academic and examination management</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow">
              <div className="text-3xl font-bold text-[var(--text)]">{card.value}</div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Examinations */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Recent Examinations</h2>
        {recentExams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-secondary)]">No examinations created yet</p>
            <a href="/lecturer/exams" className="text-sm text-[var(--primary)] hover:underline mt-2 inline-block">Create your first examination</a>
          </div>
        ) : (
          <div className="space-y-3">
            {recentExams.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-secondary)] transition-colors">
                <div>
                  <div className="text-sm font-medium text-[var(--text)]">{exam.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{exam.course?.code} — {exam.course?.title}</div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[exam.status] || "bg-gray-100 text-gray-700"}`}>
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/lecturer/students" className="bg-white rounded-xl border border-[var(--border)] p-6 hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center">
          <div className="text-sm font-medium text-[var(--text)]">Manage Students</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Add and manage students under your supervision</div>
        </a>
        <a href="/lecturer/courses" className="bg-white rounded-xl border border-[var(--border)] p-6 hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center">
          <div className="text-sm font-medium text-[var(--text)]">Manage Courses</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Create and manage your courses</div>
        </a>
        <a href="/lecturer/exams" className="bg-white rounded-xl border border-[var(--border)] p-6 hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center">
          <div className="text-sm font-medium text-[var(--text)]">Create Examination</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">Create and publish new examinations</div>
        </a>
      </div>
    </div>
  );
}
