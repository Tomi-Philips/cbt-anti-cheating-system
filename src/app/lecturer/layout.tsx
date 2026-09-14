"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/layout";
import { lecturerNavItems } from "@/components/shared/icons";
import { getCurrentUser } from "@/lib/actions";

export default function LecturerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(null);

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser({ full_name: u.full_name, email: u.email });
    });
  }, []);

  return (
    <DashboardLayout role="lecturer" user={user} navItems={lecturerNavItems}>
      {children}
    </DashboardLayout>
  );
}
