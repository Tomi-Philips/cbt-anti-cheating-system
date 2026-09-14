"use client";

import {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  UserCheck,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  AlertTriangle,
  Activity,
  Settings,
  User,
  LogOut,
} from "lucide-react";

export const adminNavItems = [
  { label: "Dashboard", href: "/admin", icon: <LayoutDashboard size={18} /> },
  {
    label: "Faculties",
    href: "/admin/faculties",
    icon: <Building2 size={18} />,
  },
  {
    label: "Departments",
    href: "/admin/departments",
    icon: <Building size={18} />,
  },
  {
    label: "Lecturers",
    href: "/admin/lecturers",
    icon: <Users size={18} />,
  },
  {
    label: "Students",
    href: "/admin/students",
    icon: <GraduationCap size={18} />,
  },
  {
    label: "Examinations",
    href: "/admin/exams",
    icon: <FileText size={18} />,
  },
  {
    label: "Results",
    href: "/admin/results",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Violations",
    href: "/admin/violations",
    icon: <AlertTriangle size={18} />,
  },
  {
    label: "Activity Logs",
    href: "/admin/activity",
    icon: <Activity size={18} />,
  },
];

export const lecturerNavItems = [
  { label: "Dashboard", href: "/lecturer", icon: <LayoutDashboard size={18} /> },
  {
    label: "Students",
    href: "/lecturer/students",
    icon: <GraduationCap size={18} />,
  },
  {
    label: "Courses",
    href: "/lecturer/courses",
    icon: <BookOpen size={18} />,
  },
  {
    label: "Examinations",
    href: "/lecturer/exams",
    icon: <FileText size={18} />,
  },
  {
    label: "Results",
    href: "/lecturer/results",
    icon: <ClipboardList size={18} />,
  },
  {
    label: "Violations",
    href: "/lecturer/violations",
    icon: <AlertTriangle size={18} />,
  },
  { label: "Profile", href: "/lecturer/profile", icon: <User size={18} /> },
];

export const studentNavItems = [
  { label: "Dashboard", href: "/student", icon: <LayoutDashboard size={18} /> },
  {
    label: "Examinations",
    href: "/student/exams",
    icon: <FileText size={18} />,
  },
  {
    label: "Results",
    href: "/student/results",
    icon: <ClipboardList size={18} />,
  },
  { label: "Profile", href: "/student/profile", icon: <User size={18} /> },
];

export {
  LayoutDashboard,
  Building2,
  Building,
  Users,
  UserCheck,
  BookOpen,
  FileText,
  ClipboardList,
  GraduationCap,
  AlertTriangle,
  Activity,
  Settings,
  User,
  LogOut,
};
