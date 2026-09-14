"use client";

import { useEffect, useState } from "react";
import { getCurrentLecturer } from "@/lib/actions";
import { Card } from "@/components/ui";

export default function LecturerProfilePage() {
  const [lecturer, setLecturer] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { getCurrentUser } = await import("@/lib/actions");
        const [l, p] = await Promise.all([getCurrentLecturer(), getCurrentUser()]);
        setLecturer(l);
        setProfile(p);
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Your account information</p>
      </div>

      <Card className="max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Full Name</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{profile?.full_name || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Email</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{profile?.email || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Staff ID</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{lecturer?.staff_id || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Role</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1 capitalize">{profile?.role || "—"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Department</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{lecturer?.department?.name || "—"}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Faculty</label>
              <p className="text-sm font-medium text-[var(--text)] mt-1">{lecturer?.faculty?.name || "—"}</p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] uppercase">Account Status</label>
            <p className="text-sm font-medium text-[var(--text)] mt-1 capitalize">{lecturer?.status || "—"}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
