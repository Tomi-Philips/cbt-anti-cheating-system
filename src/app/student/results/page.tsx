"use client";

import { useEffect, useState } from "react";
import { getCurrentStudent, getResults } from "@/lib/actions";
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
  exam?: {
    title: string;
    course?: { code: string; title: string };
    total_marks: number;
  };
  attempt?: {
    submitted_at: string;
    is_auto_submitted: boolean;
  };
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const s = await getCurrentStudent();
        if (s) {
          const data = await getResults({ studentId: s.id });
          setResults(data);
        }
      } catch {
        toast.error("Failed to load results");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getGrade(pct: number) {
    if (pct >= 70) return { label: "A", variant: "success" as const };
    if (pct >= 60) return { label: "B", variant: "info" as const };
    if (pct >= 50) return { label: "C", variant: "warning" as const };
    if (pct >= 40) return { label: "D", variant: "default" as const };
    return { label: "F", variant: "danger" as const };
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">View your examination results</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl border border-[var(--border)] animate-pulse" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-[var(--text-secondary)]">No results available yet</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Your examination results will appear here after submission.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => {
            const grade = getGrade(result.percentage);
            return (
              <Card key={result.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[var(--text)]">
                      {result.exam?.title || "Examination"}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {result.exam?.course?.code} — {result.exam?.course?.title}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-secondary)]">
                      <span>Score: <strong className="text-[var(--text)]">{result.score}/{result.total_marks}</strong></span>
                      <span>Correct: <strong className="text-green-600">{result.correct_answers}</strong></span>
                      <span>Incorrect: <strong className="text-red-600">{result.incorrect_answers}</strong></span>
                      {result.attempt?.is_auto_submitted && (
                        <Badge variant="warning">Auto-submitted</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-center ml-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                      result.percentage >= 50 ? "border-green-500" : "border-red-500"
                    }`}>
                      <span className="text-lg font-bold text-[var(--text)]">
                        {Math.round(result.percentage)}%
                      </span>
                    </div>
                    <Badge variant={grade.variant}>Grade {grade.label}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
