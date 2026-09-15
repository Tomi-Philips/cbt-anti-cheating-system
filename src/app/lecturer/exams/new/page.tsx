"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentLecturer, getCourses, createExam } from "@/lib/actions";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Course {
  id: string;
  code: string;
  title: string;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturer, setLecturer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    course_id: "",
    instructions: "This is a computer based examination. You are not permitted to leave the browser window during the examination. Tab switching and fullscreen exit will be recorded as violations. Do not attempt to copy or paste content. The examination will auto-submit when time expires.",
    duration_minutes: 60,
    start_time: "",
    end_time: "",
    randomize_questions: false,
    randomize_options: false,
    violation_threshold: 3,
  });

  useEffect(() => {
    async function load() {
      try {
        const lect = await getCurrentLecturer();
        setLecturer(lect);
        if (lect) {
          const c = await getCourses(lect.id);
          setCourses(c);
        }
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set("title", form.title);
    formData.set("course_id", form.course_id);
    formData.set("instructions", form.instructions);
    formData.set("duration_minutes", form.duration_minutes.toString());
    formData.set("start_time", form.start_time || "");
    formData.set("end_time", form.end_time || "");
    formData.set("randomize_questions", form.randomize_questions.toString());
    formData.set("randomize_options", form.randomize_options.toString());
    formData.set("violation_threshold", form.violation_threshold.toString());
    formData.set("created_by_lecturer_id", lecturer.id);

    try {
      const result = await createExam(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Examination created. Now add questions.");
      if (result.exam) {
        router.push(`/lecturer/exams/${result.exam.id}`);
      } else {
        router.push("/lecturer/exams");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Create Examination</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Step 1: Basic Information</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Examination Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. CSC 301 Mid-Semester Examination"
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-[var(--text)]">Course</label>
            <select
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              required
            >
              <option value="">Select Course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.code} — {c.title}</option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="text-xs text-amber-600">You need to create a course first.</p>
            )}
          </div>

          <Textarea
            label="Instructions"
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            rows={6}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) || 60 })}
              min={5}
              max={300}
              required
            />
            <Input
              label="Violation Threshold"
              type="number"
              value={form.violation_threshold}
              onChange={(e) => setForm({ ...form, violation_threshold: parseInt(e.target.value) || 3 })}
              min={1}
              max={20}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date/Time"
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <Input
              label="End Date/Time"
              type="datetime-local"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-[var(--text)]">Options</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.randomize_questions}
                  onChange={(e) => setForm({ ...form, randomize_questions: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Randomize question order
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={form.randomize_options}
                  onChange={(e) => setForm({ ...form, randomize_options: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                Randomize answer options
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={saving}>Create Examination</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
