"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/shared/layout";
import { adminNavItems } from "@/components/shared/icons";
import { getCurrentUser } from "@/lib/actions";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<{ full_name: string; email: string } | null>(
    null
  );

  useEffect(() => {
    getCurrentUser().then((u) => {
      if (u) setUser({ full_name: u.full_name, email: u.email });
    });
  }, []);

  return (
    <DashboardLayout role="admin" user={user} navItems={adminNavItems}>
      {children}
    </DashboardLayout>
  );
}
