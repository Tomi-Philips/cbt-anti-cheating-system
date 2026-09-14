"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge } from "@/components/ui";

interface Violation {
  id: string;
  violation_type: string;
  description: string;
  created_at: string;
  student?: { profile?: { full_name: string }; student_id: string };
  exam?: { title: string };
}

export default function AdminViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("violations")
        .select("*, student:students(*, profile:profiles(*)), exam:exams(*)")
        .order("created_at", { ascending: false });

      if (data) setViolations(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = violations.filter(
    (v) =>
      v.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      v.student?.student_id?.toLowerCase().includes(search.toLowerCase()) ||
      v.violation_type?.toLowerCase().includes(search.toLowerCase())
  );

  const typeColors: Record<string, string> = {
    TAB_SWITCH: "warning",
    FULLSCREEN_EXIT: "warning",
    COPY_ATTEMPT: "danger",
    PASTE_ATTEMPT: "danger",
    KEYBOARD_SHORTCUT: "danger",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Violations</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Institution-wide examination violations</p>
      </div>

      <div className="max-w-sm">
        <input type="text" placeholder="Search violations..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Examination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Violation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Time</th>
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
                    No violations recorded
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium">{v.student?.profile?.full_name || "—"}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{v.student?.student_id}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{v.exam?.title || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={(typeColors[v.violation_type] as any) || "default"}>
                        {v.violation_type?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">{v.description}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(v.created_at).toLocaleString()}
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
