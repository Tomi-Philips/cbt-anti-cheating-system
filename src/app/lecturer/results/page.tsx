"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getExams } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface ResultRecord {
  id: string;
  score: number;
  percentage: number;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  total_marks: number;
  created_at: string;
  student?: { profile?: { full_name: string }; student_id: string };
  exam?: { id: string; title: string; course?: { code: string } };
}

export default function LecturerResultsPage() {
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState("");
  const [exams, setExams] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const lecturer = await getCurrentLecturer();
        if (!lecturer) return;

        const examsData = await getExams(lecturer.id);
        setExams(examsData);

        const examIds = examsData.map((e) => e.id);
        if (examIds.length === 0) return;

        const supabase = createClient();
        const { data } = await supabase
          .from("results")
          .select("*, student:students(*, profile:profiles(*)), exam:exams(*, course:courses(*))")
          .in("exam_id", examIds)
          .order("created_at", { ascending: false });

        if (data) setResults(data);
      } catch {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = results.filter(
    (r) =>
      (r.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.student?.student_id?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterExam || (r as any).exam_id === filterExam)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Examination results for your courses</p>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search results..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Exams</option>
          {exams.map((e) => (
            <option key={e.id} value={e.id}>{e.title}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Examination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Percentage</th>
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
                    No results found
                  </td>
                </tr>
              ) : (
                filtered.map((result) => (
                  <tr key={result.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{result.student?.profile?.full_name || "—"}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{result.student?.student_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{result.exam?.title || "—"}</td>
                    <td className="px-4 py-3 text-sm font-mono">{result.score}/{result.total_marks}</td>
                    <td className="px-4 py-3 text-sm font-medium">{Math.round(result.percentage)}%</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${result.percentage >= 50 ? "text-green-600" : "text-red-600"}`}>
                        {result.percentage >= 50 ? "Pass" : "Fail"}
                      </span>
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
