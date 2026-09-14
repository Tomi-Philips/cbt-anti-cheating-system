"use client";

import { useEffect, useState } from "react";
import { getCurrentStudent, getStudentExams } from "@/lib/actions";
import { Card, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface StudentExam {
  id: string;
  exam_id: string;
  assigned_at: string;
  exam?: {
    id: string;
    title: string;
    status: string;
    duration_minutes: number;
    total_questions: number;
    course?: { code: string; title: string };
  };
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
  published: "bg-green-50 text-green-700 border border-green-200",
  active: "bg-amber-50 text-amber-700 border border-amber-200",
  completed: "bg-gray-50 text-gray-600 border border-gray-200",
  closed: "bg-red-50 text-red-700 border border-red-200",
};

export default function StudentExamsPage() {
  const [exams, setExams] = useState<StudentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const s = await getCurrentStudent();
        if (s) {
          const data = await getStudentExams(s.id);
          setExams(data);
        }
      } catch {
        toast.error("Failed to load examinations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = exams.filter(
    (e) =>
      e.exam?.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.exam?.course?.code?.toLowerCase().includes(search.toLowerCase())
  );

  const published = filtered.filter((e) => e.exam?.status === "published" || e.exam?.status === "active");
  const others = filtered.filter((e) => e.exam?.status !== "published" && e.exam?.status !== "active");

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Examinations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">View examinations assigned to you</p>
      </div>

      <div className="max-w-sm">
        <input
          type="text"
          placeholder="Search examinations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Published Exams */}
          {published.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Available Examinations
              </h2>
              <div className="space-y-3">
                {published.map((es) => (
                  <a
                    key={es.id}
                    href={`/student/exams/${es.exam?.id}`}
                    className="block bg-white rounded-xl border border-[var(--border)] p-5 hover:border-[var(--primary)] hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text)]">{es.exam?.title}</div>
                        <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {es.exam?.course?.code} — {es.exam?.course?.title}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-xs text-[var(--text-secondary)]">
                          <div>{es.exam?.duration_minutes} min</div>
                          <div>{es.exam?.total_questions} questions</div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[es.exam?.status || ""] || ""}`}>
                          {es.exam?.status}
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Other Status */}
          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Other Examinations
              </h2>
              <div className="space-y-3">
                {others.map((es) => (
                  <div
                    key={es.id}
                    className="bg-white rounded-xl border border-[var(--border)] p-5 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text)]">{es.exam?.title}</div>
                        <div className="text-xs text-[var(--text-secondary)]">
                          {es.exam?.course?.code} — {es.exam?.course?.title}
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[es.exam?.status || ""] || ""}`}>
                        {es.exam?.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exams.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-[var(--text-secondary)]">No examinations assigned to you</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Your lecturer will assign examinations. Check back later.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
