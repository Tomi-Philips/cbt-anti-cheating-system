"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getExamById, getQuestions, createQuestion, updateQuestion, deleteQuestion, publishExam, getExamStudents, assignStudents, removeStudentFromExam, getStudents, updateExam } from "@/lib/actions";
import { Button, Card, Input, Textarea, Badge, Modal } from "@/components/ui";
import { Toaster, toast } from "sonner";

interface Exam {
  id: string;
  title: string;
  status: string;
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  instructions: string;
  course?: { code: string; title: string };
}

interface Question {
  id: string;
  text: string;
  marks: number;
  order_index: number;
  options: { id: string; text: string; is_correct: boolean }[];
}

interface StudentOption {
  id: string;
  student_id: string;
  profile?: { full_name: string; email: string };
  level: string;
}

export default function ExamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignedStudents, setAssignedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"questions" | "students" | "settings">("questions");

  // Question form
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    text: "",
    marks: 1,
    options: [
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
      { text: "", is_correct: false },
    ],
  });
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Student assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Settings
  const [settingsForm, setSettingsForm] = useState({
    duration_minutes: 60,
    violation_threshold: 3,
    randomize_questions: false,
    randomize_options: false,
    start_time: "",
    end_time: "",
  });

  useEffect(() => {
    loadData();
  }, [examId]);

  async function loadData() {
    try {
      const [examData, questionsData, studentsData] = await Promise.all([
        getExamById(examId),
        getQuestions(examId),
        getExamStudents(examId),
      ]);
      setExam(examData);
      setQuestions(questionsData);
      setAssignedStudents(studentsData);
      setSettingsForm({
        duration_minutes: examData.duration_minutes,
        violation_threshold: examData.violation_threshold,
        randomize_questions: examData.randomize_questions,
        randomize_options: examData.randomize_options,
        start_time: examData.start_time || "",
        end_time: examData.end_time || "",
      });
    } catch {
      toast.error("Failed to load exam data");
    } finally {
      setLoading(false);
    }
  }

  // Question handlers
  function openCreateQuestion() {
    setEditingQuestion(null);
    setQuestionForm({
      text: "",
      marks: 1,
      options: [
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
        { text: "", is_correct: false },
      ],
    });
    setShowQuestionModal(true);
  }

  function openEditQuestion(q: Question) {
    setEditingQuestion(q);
    setQuestionForm({
      text: q.text,
      marks: q.marks,
      options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
    });
    setShowQuestionModal(true);
  }

  async function handleSaveQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSavingQuestion(true);

    try {
      const result = editingQuestion
        ? await updateQuestion(editingQuestion.id, examId, questionForm)
        : await createQuestion(examId, questionForm);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editingQuestion ? "Question updated" : "Question added");
      setShowQuestionModal(false);
      const q = await getQuestions(examId);
      setQuestions(q);
    } catch {
      toast.error("An error occurred");
    } finally {
      setSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Delete this question?")) return;
    const result = await deleteQuestion(id, examId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Question deleted");
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function addOption() {
    if (questionForm.options.length < 6) {
      setQuestionForm({
        ...questionForm,
        options: [...questionForm.options, { text: "", is_correct: false }],
      });
    }
  }

  function removeOption(index: number) {
    if (questionForm.options.length > 2) {
      setQuestionForm({
        ...questionForm,
        options: questionForm.options.filter((_, i) => i !== index),
      });
    }
  }

  // Student assignment
  async function openAssignStudents() {
    try {
      const students = await getStudents();
      // Filter out already assigned
      const assignedIds = assignedStudents.map((s) => s.student_id);
      const available = students.filter((s: StudentOption) => !assignedIds.includes(s.id));
      setAllStudents(available);
      setSelectedStudents([]);
      setShowAssignModal(true);
    } catch {
      toast.error("Failed to load students");
    }
  }

  async function handleAssignStudents() {
    if (selectedStudents.length === 0) return;
    const result = await assignStudents(examId, selectedStudents);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(`${selectedStudents.length} student(s) assigned`);
    setShowAssignModal(false);
    const students = await getExamStudents(examId);
    setAssignedStudents(students);
  }

  async function handleRemoveStudent(studentId: string) {
    const result = await removeStudentFromExam(examId, studentId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    setAssignedStudents((prev) => prev.filter((s) => s.student_id !== studentId));
    toast.success("Student removed");
  }

  // Publish
  async function handlePublish() {
    const result = await publishExam(examId);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Examination published successfully");
    const updated = await getExamById(examId);
    setExam(updated);
  }

  // Save settings
  async function handleSaveSettings() {
    const result = await updateExam(examId, settingsForm);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Settings saved");
    const updated = await getExamById(examId);
    setExam(updated);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!exam) {
    return <div className="text-center py-20 text-[var(--text-secondary)]">Examination not found</div>;
  }

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <Toaster position="top-right" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{exam.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {exam.course?.code} — {exam.course?.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={exam.status === "published" ? "success" : exam.status === "draft" ? "warning" : "default"}>
            {exam.status}
          </Badge>
          {exam.status === "draft" && (
            <Button onClick={handlePublish} disabled={questions.length === 0 || assignedStudents.length === 0}>
              Publish Exam
            </Button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex gap-4 text-sm text-[var(--text-secondary)]">
        <span>Questions: <strong className="text-[var(--text)]">{questions.length}</strong></span>
        <span>Total Marks: <strong className="text-[var(--text)]">{totalMarks}</strong></span>
        <span>Students: <strong className="text-[var(--text)]">{assignedStudents.length}</strong></span>
        <span>Duration: <strong className="text-[var(--text)]">{exam.duration_minutes} min</strong></span>
      </div>

      {/* Tabs */}
      <div className="border-b border-[var(--border)]">
        <div className="flex gap-6">
          {(["questions", "students", "settings"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Tab */}
      {activeTab === "questions" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--text)]">Questions</h2>
            <Button onClick={openCreateQuestion}>Add Question</Button>
          </div>

          {questions.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-secondary)]">No questions added yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Add questions to create the examination</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {questions.map((q, index) => (
                <Card key={q.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-[var(--text-secondary)] bg-gray-100 px-2 py-0.5 rounded">
                          Q{index + 1} • {q.marks} {q.marks === 1 ? "mark" : "marks"}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text)] mb-3">{q.text}</p>
                      <div className="space-y-1">
                        {q.options.map((opt) => (
                          <div key={opt.id} className="flex items-center gap-2 text-sm">
                            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${opt.is_correct ? "border-green-500 bg-green-500" : "border-gray-300"}`} />
                            <span className={opt.is_correct ? "text-green-700 font-medium" : "text-[var(--text-secondary)]"}>
                              {opt.text} {opt.is_correct && "✓"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => openEditQuestion(q)} className="text-sm text-[var(--primary)] hover:underline">Edit</button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-sm text-red-600 hover:underline">Delete</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-[var(--text)]">Assigned Students</h2>
            {exam.status === "draft" && (
              <Button onClick={openAssignStudents}>Assign Students</Button>
            )}
          </div>

          {assignedStudents.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-sm text-[var(--text-secondary)]">No students assigned yet</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Assign students before publishing the exam</p>
              </div>
            </Card>
          ) : (
            <Card padding={false}>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Student ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">Level</th>
                    {exam.status === "draft" && (
                      <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {assignedStudents.map((es: any) => (
                    <tr key={es.id} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3 text-sm font-medium">{es.student?.profile?.full_name || "—"}</td>
                      <td className="px-4 py-3 text-sm font-mono">{es.student?.student_id}</td>
                      <td className="px-4 py-3 text-sm">{es.student?.level}</td>
                      {exam.status === "draft" && (
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleRemoveStudent(es.student_id)} className="text-sm text-red-600 hover:underline">Remove</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">Examination Settings</h2>
          <Card>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={settingsForm.duration_minutes}
                  onChange={(e) => setSettingsForm({ ...settingsForm, duration_minutes: parseInt(e.target.value) || 60 })}
                />
                <Input
                  label="Violation Threshold"
                  type="number"
                  value={settingsForm.violation_threshold}
                  onChange={(e) => setSettingsForm({ ...settingsForm, violation_threshold: parseInt(e.target.value) || 3 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date/Time"
                  type="datetime-local"
                  value={settingsForm.start_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, start_time: e.target.value })}
                />
                <Input
                  label="End Date/Time"
                  type="datetime-local"
                  value={settingsForm.end_time}
                  onChange={(e) => setSettingsForm({ ...settingsForm, end_time: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={settingsForm.randomize_questions}
                    onChange={(e) => setSettingsForm({ ...settingsForm, randomize_questions: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
                  />
                  Randomize questions
                </label>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={settingsForm.randomize_options}
                    onChange={(e) => setSettingsForm({ ...settingsForm, randomize_options: e.target.checked })}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
                  />
                  Randomize options
                </label>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings}>Save Settings</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Question Modal */}
      <Modal isOpen={showQuestionModal} onClose={() => setShowQuestionModal(false)} title={editingQuestion ? "Edit Question" : "Add Question"}>
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <Textarea
            label="Question Text"
            value={questionForm.text}
            onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
            rows={3}
            required
          />
          <Input
            label="Marks"
            type="number"
            value={questionForm.marks}
            onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />

          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--text)]">Answer Options</label>
            {questionForm.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct_answer"
                  checked={opt.is_correct}
                  onChange={() => {
                    const updated = questionForm.options.map((o, j) => ({
                      ...o,
                      is_correct: j === i,
                    }));
                    setQuestionForm({ ...questionForm, options: updated });
                  }}
                  className="w-4 h-4 text-[var(--primary)]"
                  title="Mark as correct answer"
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const updated = [...questionForm.options];
                    updated[i] = { ...updated[i], text: e.target.value };
                    setQuestionForm({ ...questionForm, options: updated });
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 px-3 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  required
                />
                {questionForm.options.length > 2 && (
                  <button type="button" onClick={() => removeOption(i)} className="text-red-500 hover:text-red-600 text-sm">✕</button>
                )}
              </div>
            ))}
            {questionForm.options.length < 6 && (
              <button type="button" onClick={addOption} className="text-sm text-[var(--primary)] hover:underline">
                + Add option
              </button>
            )}
            <p className="text-xs text-[var(--text-secondary)]">Select the radio button next to the correct answer</p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowQuestionModal(false)}>Cancel</Button>
            <Button type="submit" loading={savingQuestion}>{editingQuestion ? "Update" : "Add"}</Button>
          </div>
        </form>
      </Modal>

      {/* Assign Students Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Students">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">Select students to assign to this examination:</p>
          <div className="max-h-64 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-3">
            {allStudents.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">No available students to assign</p>
            ) : (
              allStudents.map((s) => (
                <label key={s.id} className="flex items-center gap-3 p-2 rounded hover:bg-[var(--bg-secondary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, s.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter((id) => id !== s.id));
                      }
                    }}
                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)]"
                  />
                  <div>
                    <div className="text-sm font-medium">{s.profile?.full_name || "—"}</div>
                    <div className="text-xs text-[var(--text-secondary)]">{s.student_id} • Level {s.level}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm text-[var(--text-secondary)]">{selectedStudents.length} selected</span>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowAssignModal(false)}>Cancel</Button>
              <Button onClick={handleAssignStudents} disabled={selectedStudents.length === 0}>Assign</Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
