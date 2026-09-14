"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, Badge } from "@/components/ui";

interface ActivityLog {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
  student?: { profile?: { full_name: string }; student_id: string };
  exam?: { title: string };
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("activity_logs")
        .select("*, student:students(*, profile:profiles(*)), exam:exams(*)")
        .order("created_at", { ascending: false })
        .limit(200);

      if (data) setLogs(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.event_type?.toLowerCase().includes(search.toLowerCase()) ||
      l.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const eventTypeColors: Record<string, string> = {
    EXAM_STARTED: "info",
    ANSWER_SELECTED: "success",
    ANSWER_CHANGED: "info",
    TAB_SWITCH: "warning",
    FULLSCREEN_EXIT: "warning",
    COPY_ATTEMPT: "danger",
    PASTE_ATTEMPT: "danger",
    EXAM_SUBMITTED: "success",
    EXAM_AUTO_SUBMITTED: "warning",
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Activity Logs</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Recorded examination events</p>
      </div>

      <div className="max-w-sm">
        <input type="text" placeholder="Search activity..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Examination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Event</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(4)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--text-secondary)]">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 text-sm">{log.student?.profile?.full_name || "—"}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{log.exam?.title || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={(eventTypeColors[log.event_type] as any) || "default"}>
                        {log.event_type?.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                      {new Date(log.created_at).toLocaleString()}
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
