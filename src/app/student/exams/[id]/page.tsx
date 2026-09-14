"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getCurrentStudent,
  getExamById,
  getQuestions,
  startExamAttempt,
  saveAnswer,
  submitExam,
  recordViolation,
  logActivity,
} from "@/lib/actions";
import { Button, Modal } from "@/components/ui";
import { Toaster, toast } from "sonner";

export default function ExamTakePage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [attempt, setAttempt] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [violationCount, setViolationCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);

  // Anti-cheating state
  const isFullscreenRef = useRef(false);
  const warningThreshold = exam?.violation_threshold || 3;

  // Load exam data
  useEffect(() => {
    async function load() {
      try {
        const s = await getCurrentStudent();
        setStudent(s);
        const [examData, questionsData] = await Promise.all([
          getExamById(examId),
          getQuestions(examId),
        ]);
        setExam(examData);
        setQuestions(questionsData);
      } catch {
        toast.error("Failed to load examination");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [examId]);

  // Start exam
  const handleStartExam = useCallback(async () => {
    if (!student) return;

    const result = await startExamAttempt(examId, student.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.attempt) {
      setAttempt(result.attempt);
      setStarted(true);

      // Load existing answers
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: existingAnswers } = await supabase
        .from("student_answers")
        .select("question_id, option_id")
        .eq("attempt_id", result.attempt.id);

      if (existingAnswers) {
        const answerMap: Record<string, string> = {};
        existingAnswers.forEach((a: any) => {
          if (a.option_id) answerMap[a.question_id] = a.option_id;
        });
        setAnswers(answerMap);
      }

      // Enter fullscreen
      try {
        if (examContainerRef.current) {
          await examContainerRef.current.requestFullscreen();
          isFullscreenRef.current = true;
        }
      } catch {
        // Fullscreen not supported or denied
      }

      // Start timer
      const startedAt = new Date(result.attempt.started_at).getTime();
      const durationMs = exam.duration_minutes * 60 * 1000;
      const remaining = Math.max(0, startedAt + durationMs - Date.now());
      setTimeLeft(Math.floor(remaining / 1000));
    }
  }, [student, examId, exam]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Auto-submit
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, timeLeft > 0]);

  // Anti-cheating: Tab switch detection
  useEffect(() => {
    if (!started || submitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !submitted) {
        handleViolation("TAB_SWITCH", "You have left the examination window. This activity has been recorded.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [started, submitted, attempt]);

  // Anti-cheating: Fullscreen exit detection
  useEffect(() => {
    if (!started || submitted) return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (!isFullscreen && isFullscreenRef.current && !submitted) {
        handleViolation("FULLSCREEN_EXIT", "You have exited fullscreen mode. This activity has been recorded.");
        // Try to re-enter fullscreen
        setTimeout(() => {
          if (examContainerRef.current && !submitted) {
            examContainerRef.current.requestFullscreen().catch(() => {});
          }
        }, 1000);
      }
      isFullscreenRef.current = isFullscreen;
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [started, submitted, attempt]);

  // Anti-cheating: Keyboard restrictions
  useEffect(() => {
    if (!started || submitted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts
      const blockedKeys = [
        { key: "c", ctrl: true },
        { key: "v", ctrl: true },
        { key: "x", ctrl: true },
        { key: "u", ctrl: true },
        { key: "F12" },
        { key: "F5" },
        { key: "i", ctrl: true, shift: true },
      ];

      for (const blocked of blockedKeys) {
        if (
          e.key.toLowerCase() === blocked.key.toLowerCase() &&
          (!blocked.ctrl || e.ctrlKey) &&
          (!blocked.shift || e.shiftKey)
        ) {
          e.preventDefault();
          handleViolation("KEYBOARD_SHORTCUT", `Attempted keyboard shortcut: ${e.key}`);
          return false;
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation("COPY_ATTEMPT", "Attempted to open context menu");
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("COPY_ATTEMPT", "Attempted to copy content");
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation("PASTE_ATTEMPT", "Attempted to paste content");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [started, submitted, attempt]);

  // Violation handler
  async function handleViolation(type: string, description: string) {
    if (!attempt || !student || submitted) return;

    setViolationCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= warningThreshold) {
        // Auto-submit on threshold
        handleSubmit(true);
      }
      return newCount;
    });

    setWarningMessage(description);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 4000);

    await recordViolation(attempt.id, student.id, examId, type, description);
    await logActivity(attempt.id, student.id, examId, type, { description });
  }

  // Answer handler
  async function handleAnswer(questionId: string, optionId: string) {
    if (!attempt || submitted) return;

    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    await saveAnswer(attempt.id, questionId, optionId);
    await logActivity(attempt.id, student.id, examId, "ANSWER_SELECTED", {
      question_id: questionId,
      option_id: optionId,
    });
  }

  // Submit
  async function handleSubmit(autoSubmit = false) {
    if (submitted || submitting || !attempt) return;

    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);

    await logActivity(attempt.id, student.id, examId, autoSubmit ? "EXAM_AUTO_SUBMITTED" : "EXAM_SUBMITTED", {});

    const result = await submitExam(attempt.id, autoSubmit);
    if (result.error) {
      toast.error(result.error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);

    // Exit fullscreen
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {}

    toast.success(autoSubmit ? "Examination auto-submitted" : "Examination submitted successfully");
  }

  // Format time
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-xl border border-[var(--border)] shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[var(--text)] mb-2">Examination Submitted</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Your answers have been saved. You can now close this window.
          </p>
          <Button onClick={() => router.push("/student/results")}>View Results</Button>
        </div>
      </div>
    );
  }

  // Pre-exam instructions
  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Toaster position="top-right" />
        <div className="max-w-lg w-full bg-white rounded-xl border border-[var(--border)] shadow-sm p-8">
          <h1 className="text-xl font-bold text-[var(--text)] mb-1">{exam?.title}</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {exam?.course?.code} — {exam?.course?.title}
          </p>

          <div className="space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>Duration</span>
              <span className="font-medium text-[var(--text)]">{exam?.duration_minutes} minutes</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>Questions</span>
              <span className="font-medium text-[var(--text)]">{exam?.total_questions}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span>Total Marks</span>
              <span className="font-medium text-[var(--text)]">{exam?.total_marks}</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="text-sm font-semibold text-amber-800 mb-2">Examination Rules</h3>
            <ul className="text-xs text-amber-700 space-y-1">
              <li>• Do not leave the examination window</li>
              <li>• Do not exit fullscreen mode</li>
              <li>• Copy and paste are disabled</li>
              <li>• Tab switching is recorded as a violation</li>
              <li>• The examination will auto-submit when time expires</li>
              <li>• After {warningThreshold} violations, the exam will auto-submit</li>
            </ul>
          </div>

          {exam?.instructions && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-semibold text-[var(--text)] mb-2">Additional Instructions</h3>
              <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                {exam.instructions}
              </p>
            </div>
          )}

          <Button onClick={handleStartExam} className="w-full mt-6" size="lg">
            Start Examination
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div ref={examContainerRef} className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      {/* Warning overlay */}
      {showWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <div className="bg-white border border-amber-300 rounded-lg shadow-lg px-6 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[var(--text)]">Examination Warning</p>
              <p className="text-xs text-[var(--text-secondary)]">{warningMessage}</p>
              <p className="text-xs text-amber-600 mt-0.5">Violation {violationCount} of {warningThreshold}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div className="bg-white border-b border-[var(--border)] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-[var(--text)]">{exam?.title}</h1>
            <p className="text-xs text-[var(--text-secondary)]">{exam?.course?.code}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-[var(--text-secondary)]">Answered</div>
              <div className="text-sm font-medium text-[var(--text)]">{answeredCount}/{totalQuestions}</div>
            </div>
            <div className={`text-center px-4 py-2 rounded-lg ${timeLeft < 300 ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
              <div className="text-xs text-[var(--text-secondary)]">Time Remaining</div>
              <div className={`text-lg font-bold font-mono ${timeLeft < 300 ? "text-red-600" : "text-[var(--text)]"}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-xl border border-[var(--border)] p-8">
            {/* Question header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xs font-medium text-[var(--text-secondary)] bg-gray-100 px-3 py-1 rounded-full">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
              </span>
            </div>

            {/* Question text */}
            <p className="text-base text-[var(--text)] mb-8 leading-relaxed">
              {currentQuestion.text}
            </p>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options?.map((option: any, i: number) => {
                const isSelected = answers[currentQuestion.id] === option.id;
                const labels = ["A", "B", "C", "D", "E", "F"];

                return (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(currentQuestion.id, option.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected
                        ? "border-[var(--primary)] bg-blue-50"
                        : "border-[var(--border)] hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                        isSelected
                          ? "bg-[var(--primary)] text-white"
                          : "bg-gray-100 text-[var(--text-secondary)]"
                      }`}
                    >
                      {labels[i]}
                    </span>
                    <span className="text-sm text-[var(--text)]">{option.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>

          {/* Question navigation dots */}
          <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-[var(--primary)] text-white"
                    : answers[q.id]
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-gray-100 text-[var(--text-secondary)] hover:bg-gray-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            disabled={currentIndex === totalQuestions - 1}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      <Modal isOpen={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} title="Submit Examination">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to submit? You have answered {answeredCount} of {totalQuestions} questions.
          </p>
          {answeredCount < totalQuestions && (
            <p className="text-sm text-amber-600">
              Warning: {totalQuestions - answeredCount} question(s) have not been answered.
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowSubmitConfirm(false)}>Continue Exam</Button>
            <Button variant="danger" onClick={() => { setShowSubmitConfirm(false); handleSubmit(false); }} loading={submitting}>
              Submit Exam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
