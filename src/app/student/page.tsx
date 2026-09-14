"use client";

import { useEffect, useState } from "react";
import { getCurrentStudent, getStudentExams } from "@/lib/actions";

export default function StudentDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const s = await getCurrentStudent();
        setStudent(s);
        if (s) {
          const data = await getStudentExams(s.id);
          setExams(data);
        }
      } catch {
        console.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const publishedExams = exams.filter((e) => e.exam?.status === "published" || e.exam?.status === "active");
  const upcomingExams = exams.filter((e) => e.exam?.status === "scheduled");
  const draftExams = exams.filter((e) => e.exam?.status === "draft");

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Student Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {student?.department?.name} — {student?.faculty?.name}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[var(--border)] p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <div className="text-sm text-[var(--text-secondary)]">Available Examinations</div>
            <div className="text-3xl font-bold text-[var(--text)] mt-1">{publishedExams.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-6">
            <div className="text-sm text-[var(--text-secondary)]">Upcoming Examinations</div>
            <div className="text-3xl font-bold text-[var(--text)] mt-1">{upcomingExams.length}</div>
          </div>
        </div>
      )}

      {/* Available Exams */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">Available Examinations</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : publishedExams.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-secondary)]">No examinations available</p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Published examinations assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedExams.map((es) => (
              <a
                key={es.id}
                href={`/student/exams/${es.exam?.id}`}
                className="block p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{es.exam?.title}</div>
                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {es.exam?.course?.code} — {es.exam?.course?.title}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[var(--text-secondary)]">{es.exam?.duration_minutes} min</div>
                    <div className="text-xs text-[var(--text-secondary)]">{es.exam?.total_questions} questions</div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
