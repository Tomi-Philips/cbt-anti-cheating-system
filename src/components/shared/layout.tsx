"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/actions";

interface SidebarProps {
  role: "admin" | "lecturer" | "student";
  user: { full_name: string; email: string } | null;
  navItems: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
}

export function Sidebar({ role, user, navItems }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const roleColors = {
    admin: "var(--admin-color)",
    lecturer: "var(--lecturer-color)",
    student: "var(--student-color)",
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-white border-r border-[var(--border)] z-40 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-64"
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: roleColors[role] }}
            >
              {role.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-[var(--text)] truncate">
                  CBT System
                </h1>
                <p className="text-xs text-[var(--text-secondary)] capitalize truncate">
                  {role} Portal
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === `/${role}`
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--bg-active)] text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]"
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User & Toggle */}
        <div className="border-t border-[var(--border)] p-3">
          {!collapsed && user && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-[var(--text)] truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {user.email}
              </p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                />
              </svg>
              {!collapsed && <span>Collapse</span>}
            </button>
            <button
              onClick={() => signOut()}
              className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
              title="Sign out"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function DashboardLayout({
  children,
  role,
  user,
  navItems,
}: {
  children: React.ReactNode;
  role: "admin" | "lecturer" | "student";
  user: { full_name: string; email: string } | null;
  navItems: {
    label: string;
    href: string;
    icon: React.ReactNode;
  }[];
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar role={role} user={user} navItems={navItems} />
      <main className="ml-64 min-h-screen transition-all duration-300">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
