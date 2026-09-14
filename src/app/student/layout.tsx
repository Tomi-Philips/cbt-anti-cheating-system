"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/layout";
import { studentNavItems } from "@/components/shared/icons";
import { getCurrentUser } from "@/lib/actions";

export default function StudentLayout({
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
    <DashboardLayout role="student" user={user} navItems={studentNavItems}>
      {children}
    </DashboardLayout>
  );
}
