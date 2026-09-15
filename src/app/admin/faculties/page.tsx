"use client";

import { useEffect, useState } from "react";
import { getDepartments, getFaculties } from "@/lib/actions";
import { Card, Badge } from "@/components/ui";

interface Faculty { id: string; name: string; code: string }
interface Department { id: string; name: string; code: string; faculty_id: string; status: string; faculty?: { name: string } }

export default function FacultiesPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFaculties(), getDepartments()])
      .then(([f, d]) => { setFaculties(f); setDepartments(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = faculties.map((f) => ({
    faculty: f,
    departments: departments.filter((d) => d.faculty_id === f.id),
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Faculties &amp; Departments</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Academic organizational structure</p>
      </div>
      {loading ? (
        <div className="text-sm text-[var(--text-secondary)]">Loading...</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ faculty, departments: deptList }) => (
            <Card key={faculty.id}>
              <div className="p-4 border-b border-[var(--border)]">
                <h2 className="font-semibold text-[var(--text)]">{faculty.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">Code: {faculty.code}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Department</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Code</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {deptList.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-[var(--text-secondary)]">No departments</td></tr>
                    ) : deptList.map((d) => (
                      <tr key={d.id}>
                        <td className="px-4 py-3 text-sm text-[var(--text)]">{d.name}</td>
                        <td className="px-4 py-3 text-sm font-mono text-[var(--text-secondary)]">{d.code}</td>
                        <td className="px-4 py-3"><Badge variant={d.status === "active" ? "success" : "default"}>{d.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}