"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/lib/actions";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    total_faculties: number;
    total_departments: number;
    total_lecturers: number;
    total_students: number;
    active_exams: number;
    recent_violations: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: "Total Faculties",
      value: stats?.total_faculties ?? 0,
      color: "var(--admin-color)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Total Departments",
      value: stats?.total_departments ?? 0,
      color: "var(--primary-light)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
    {
      label: "Total Lecturers",
      value: stats?.total_lecturers ?? 0,
      color: "#7c3aed",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Total Students",
      value: stats?.total_students ?? 0,
      color: "var(--student-color)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
    },
    {
      label: "Active Examinations",
      value: stats?.active_exams ?? 0,
      color: "var(--warning)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: "Recent Violations",
      value: stats?.recent_violations ?? 0,
      color: "var(--error)",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Admin Dashboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Institution-wide overview and management
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-[var(--border)] p-6 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl border border-[var(--border)] p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${card.color}15`, color: card.color }}
                >
                  {card.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-[var(--text)]">
                {card.value.toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-secondary)] mt-1">
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Access */}
      <div className="bg-white rounded-xl border border-[var(--border)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <a
            href="/admin/faculties"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">Manage Faculties</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Create and manage academic faculties</div>
          </a>
          <a
            href="/admin/departments"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">Manage Departments</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Organize departments by faculty</div>
          </a>
          <a
            href="/admin/programmes"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">Manage Programmes</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Degree programmes per department</div>
          </a>
          <a
            href="/admin/courses"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">Manage Courses</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Courses, levels, semesters and allocations</div>
          </a>
          <a
            href="/admin/lecturers"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">Manage Lecturers</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Add and assign lecturer accounts</div>
          </a>
          <a
            href="/admin/students"
            className="p-4 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--bg-active)] transition-colors text-center"
          >
            <div className="text-sm font-medium text-[var(--text)]">View Students</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">View all registered students</div>
          </a>
        </div>
      </div>
    </div>
  );
}
