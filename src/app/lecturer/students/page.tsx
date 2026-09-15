"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer, getRegistrations } from "@/lib/actions";
import { Card, Badge } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface StudentRecord {
  id: string;
  student_id: string;
  level: string;
  status: string;
  profile?: { id: string; full_name: string; email: string };
  department?: { name: string };
}

export default function LecturerStudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const lect = await getCurrentLecturer();
        if (lect) {
          const data = await getRegistrations(undefined, undefined, lect.id);
          // De-duplicate students across courses
          const map = new Map<string, StudentRecord>();
          (data || []).forEach((r: { student?: StudentRecord }) => {
            if (r.student && !map.has(r.student.id)) map.set(r.student.id, r.student);
          });
          setStudents(Array.from(map.values()));
        }
      } catch {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const levels = ["100", "200", "300", "400", "500", "600", "700", "800"];
  const filtered = students.filter(
    (s) =>
      (s.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        s.student_id?.toLowerCase().includes(search.toLowerCase())) &&
      (!filterLevel || s.level === filterLevel)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Students</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Students enrolled in your allocated courses</p>
        </div>
      </div>

      <div className="flex gap-3 max-w-xl">
        <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
        <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)} className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
          <option value="">All Levels</option>
          {levels.map((l) => (
            <option key={l} value={l}>Level {l}</option>
          ))}
        </select>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
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
                    No students found
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-[var(--text)]">{student.profile?.full_name || "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{student.student_id}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{student.profile?.email || "—"}</td>
                    <td className="px-4 py-3 text-sm">{student.level}</td>
                    <td className="px-4 py-3">
                      <Badge variant={student.status === "active" ? "success" : "default"}>{student.status}</Badge>
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