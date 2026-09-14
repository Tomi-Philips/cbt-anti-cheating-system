"use client";

import { useEffect, useState } from "react";
import { getExams } from "@/lib/actions";
import { Card, Badge } from "@/components/ui";

interface ExamRecord {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  start_time: string | null;
  created_at: string;
  course?: { code: string; title: string };
  lecturer?: { profile?: { full_name: string } };
}

const statusColors: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
  draft: "default",
  scheduled: "info",
  published: "success",
  active: "warning",
  completed: "default",
  closed: "danger",
};

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    getExams()
      .then(setExams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = exams.filter(
    (e) =>
      (e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.course?.code?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterStatus || e.status === filterStatus)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Examinations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Institution-wide examination overview</p>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search examinations..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Lecturer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Questions</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No examinations found
                  </td>
                </tr>
              ) : (
                filtered.map((exam) => (
                  <tr key={exam.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{exam.title}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {exam.course?.code} — {exam.course?.title}
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{exam.lecturer?.profile?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm">{exam.duration_minutes} min</td>
                    <td className="px-4 py-3 text-sm">{exam.total_questions}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusColors[exam.status] || "default"}>{exam.status}</Badge>
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
