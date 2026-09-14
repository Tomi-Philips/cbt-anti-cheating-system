"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentLecturer, getExams, deleteExam, getCourses } from "@/lib/actions";
import { Button, Card, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface ExamRecord {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  created_at: string;
  course?: { code: string; title: string };
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  published: "bg-green-50 text-green-700 border border-green-200",
  active: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-gray-50 text-gray-600 border border-gray-200",
  closed: "bg-red-50 text-red-700 border border-red-200",
};

export default function LecturerExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const lecturer = await getCurrentLecturer();
        if (lecturer) {
          const data = await getExams(lecturer.id);
          setExams(data);
        }
      } catch {
        toast.error("Failed to load exams");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this exam? This cannot be undone.")) return;
    const result = await deleteExam(id);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Exam deleted");
    setExams((prev) => prev.filter((e) => e.id !== id));
  }

  const filtered = exams.filter(
    (e) =>
      (e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.course?.code?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterStatus || e.status === filterStatus)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Examinations</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Create and manage examinations</p>
        </div>
        <Button onClick={() => router.push("/lecturer/exams/new")}>Create Examination</Button>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search examinations..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Questions</th>
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
                    No examinations found
                  </td>
                </tr>
              ) : (
                filtered.map((exam) => (
                  <tr key={exam.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => router.push(`/lecturer/exams/${exam.id}`)} className="text-sm font-medium text-[var(--primary)] hover:underline">
                        {exam.title}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{exam.course?.code}</td>
                    <td className="px-4 py-3 text-sm">{exam.duration_minutes} min</td>
                    <td className="px-4 py-3 text-sm">{exam.total_questions}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[exam.status] || "bg-gray-100 text-gray-700"}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {exam.status === "draft" && (
                          <button onClick={() => router.push(`/lecturer/exams/${exam.id}`)} className="text-sm text-[var(--primary)] hover:text-[var(--primary-dark)]">
                            Edit
                          </button>
                        )}
                        {(exam.status === "draft") && (
                          <button onClick={() => handleDelete(exam.id)} className="text-sm text-red-600 hover:text-red-700">
                            Delete
                          </button>
                        )}
                      </div>
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
