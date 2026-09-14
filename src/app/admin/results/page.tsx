"use client";

import { useEffect, useState } from "react";
import { getResults } from "@/lib/actions";
import { Card } from "@/components/ui";

export default function AdminResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getResults({})
      .then(setResults)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = results.filter(
    (r) =>
      r.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.exam?.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.exam?.course?.code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Results</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Institution-wide examination results</p>
      </div>

      <div className="max-w-sm">
        <input type="text" placeholder="Search results..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
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
                    <td className="px-4 py-3 text-sm font-medium">{result.student?.profile?.full_name || "—"}</td>
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
