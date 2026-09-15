"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const DEFAULT_STUDENT_PASSWORD = "password123";

// Auth actions
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found" };
  }

  return { success: true, role: profile.role };
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: string
) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, user: data.user };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

export async function getCurrentLecturer() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: lecturer } = await supabase
    .from("lecturers")
    .select("*, department:departments(*), faculty:faculties(*)")
    .eq("profile_id", user.id)
    .single();

  return lecturer;
}

export async function getCurrentStudent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: student } = await supabase
    .from("students")
    .select("*, department:departments(*), faculty:faculties(*)")
    .eq("profile_id", user.id)
    .single();

  return student;
}

// Faculty actions
export async function getFaculties() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("faculties")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createFaculty(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("faculties").insert({
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    description: (formData.get("description") as string) || null,
    status: (formData.get("status") as string) || "active",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A faculty with this code already exists" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/faculties");
  return { success: true };
}

export async function updateFaculty(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("faculties")
    .update({
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      description: (formData.get("description") as string) || null,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { success: true };
}

export async function deleteFaculty(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("faculties").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/faculties");
  return { success: true };
}

// Department actions
export async function getDepartments(facultyId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("departments")
    .select("*, faculty:faculties(*)")
    .order("created_at", { ascending: false });

  if (facultyId) {
    query = query.eq("faculty_id", facultyId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("departments").insert({
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    faculty_id: formData.get("faculty_id") as string,
    description: (formData.get("description") as string) || null,
    status: (formData.get("status") as string) || "active",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A department with this code already exists in this faculty" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/departments");
  return { success: true };
}

export async function updateDepartment(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("departments")
    .update({
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      faculty_id: formData.get("faculty_id") as string,
      description: (formData.get("description") as string) || null,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/departments");
  return { success: true };
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("departments").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/departments");
  return { success: true };
}

// Lecturer actions
export async function getLecturers(departmentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("lecturers")
    .select("*, profile:profiles(*), department:departments(*), faculty:faculties(*)")
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createLecturer(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const staffId = formData.get("staff_id") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;

  // Create auth user using admin client (requires service role key)
  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "lecturer",
    },
  });

  if (authError) return { error: authError.message };

  // Create profile explicitly (the trigger may fail due to RLS)
  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: "lecturer",
      status: "active",
    });

  if (profileError) {
    // If profile already exists from trigger, that's fine
    if (profileError.code !== "23505") {
      return { error: profileError.message };
    }
  }

  // Create lecturer record
  const { error } = await supabase.from("lecturers").insert({
    profile_id: authData.user.id,
    staff_id: staffId,
    department_id: departmentId,
    faculty_id: facultyId,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/lecturers");
  return { success: true };
}

export async function updateLecturer(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("lecturers")
    .update({
      staff_id: formData.get("staff_id") as string,
      department_id: formData.get("department_id") as string,
      faculty_id: formData.get("faculty_id") as string,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Also update profile
  const profileId = formData.get("profile_id") as string;
  if (profileId) {
    await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        status: formData.get("status") as string,
      })
      .eq("id", profileId);
  }

  revalidatePath("/admin/lecturers");
  return { success: true };
}

export async function deleteLecturer(id: string, profileId: string) {
  const supabase = await createClient();

  // Delete lecturer record first
  const { error } = await supabase.from("lecturers").delete().eq("id", id);
  if (error) return { error: error.message };

  // Delete auth user using admin client (requires service role key)
  const adminClient = createAdminClient();
  await adminClient.auth.admin.deleteUser(profileId);

  revalidatePath("/admin/lecturers");
  return { success: true };
}

// Student actions
export async function getStudents(lecturerId?: string, departmentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("*, profile:profiles(*), department:departments(*), faculty:faculties(*)")
    .order("created_at", { ascending: false });

  if (lecturerId) {
    query = query.eq("lecturer_id", lecturerId);
  }
  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createStudent(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const studentId = formData.get("student_id") as string;
  const level = formData.get("level") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;
  const lecturerId = formData.get("lecturer_id") as string;

  const password = DEFAULT_STUDENT_PASSWORD;

  // Create auth user using admin client (requires service role key)
  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "student",
    },
  });

  if (authError) return { error: authError.message };

  // Create profile explicitly (the trigger may fail due to RLS)
  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: "student",
      status: "active",
    });

  if (profileError) {
    if (profileError.code !== "23505") {
      return { error: profileError.message };
    }
  }

  // Create student record using admin client (bypasses RLS)
  const { error } = await adminClient.from("students").insert({
    profile_id: authData.user.id,
    student_id: studentId,
    department_id: departmentId,
    faculty_id: facultyId,
    lecturer_id: lecturerId,
    level,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/lecturer/students");
  return { success: true, defaultPassword: password };
}

export async function updateStudent(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      student_id: formData.get("student_id") as string,
      level: formData.get("level") as string,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Also update profile
  const profileId = formData.get("profile_id") as string;
  if (profileId) {
    await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name") as string,
        status: formData.get("status") as string,
      })
      .eq("id", profileId);
  }

  revalidatePath("/lecturer/students");
  return { success: true };
}

// Course actions
export async function getCourses(lecturerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select("*, department:departments(*), lecturer:lecturers(*, profile:profiles(*))")
    .order("created_at", { ascending: false });

  if (lecturerId) {
    query = query.eq("lecturer_id", lecturerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("courses").insert({
    code: formData.get("code") as string,
    title: formData.get("title") as string,
    department_id: formData.get("department_id") as string,
    lecturer_id: formData.get("lecturer_id") as string,
    status: "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/lecturer/courses");
  return { success: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({
      code: formData.get("code") as string,
      title: formData.get("title") as string,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/lecturer/courses");
  return { success: true };
}

export async function deleteCourse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lecturer/courses");
  return { success: true };
}

// Exam actions
export async function getExams(lecturerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("exams")
    .select("*, course:courses(*), lecturer:lecturers(*, profile:profiles(*))")
    .order("created_at", { ascending: false });

  if (lecturerId) {
    query = query.eq("lecturer_id", lecturerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getExamById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exams")
    .select("*, course:courses(*), lecturer:lecturers(*, profile:profiles(*))")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createExam(formData: FormData) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exams")
    .insert({
      title: formData.get("title") as string,
      course_id: formData.get("course_id") as string,
      lecturer_id: formData.get("lecturer_id") as string,
      instructions: (formData.get("instructions") as string) || "",
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
      start_time: (formData.get("start_time") as string) || null,
      end_time: (formData.get("end_time") as string) || null,
      randomize_questions: formData.get("randomize_questions") === "true",
      randomize_options: formData.get("randomize_options") === "true",
      violation_threshold: parseInt(formData.get("violation_threshold") as string) || 3,
      status: "draft",
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/lecturer/exams");
  return { success: true, exam: data };
}

export async function updateExam(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient();

  const { error } = await supabase.from("exams").update(updates).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lecturer/exams");
  revalidatePath(`/lecturer/exams/${id}`);
  return { success: true };
}

export async function publishExam(id: string) {
  const supabase = await createClient();

  // Verify exam has questions and students
  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", id);

  const { count: studentCount } = await supabase
    .from("exam_students")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", id);

  if (!questionCount || questionCount === 0) {
    return { error: "Cannot publish an exam without questions" };
  }

  if (!studentCount || studentCount === 0) {
    return { error: "Cannot publish an exam without assigned students" };
  }

  // Get total marks
  const { data: questions } = await supabase
    .from("questions")
    .select("marks")
    .eq("exam_id", id);

  const totalMarks = questions?.reduce((sum, q) => sum + q.marks, 0) || 0;

  const { error } = await supabase
    .from("exams")
    .update({
      status: "published",
      total_questions: questionCount,
      total_marks: totalMarks,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/lecturer/exams");
  return { success: true };
}

export async function deleteExam(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("exams").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/lecturer/exams");
  return { success: true };
}

// Question actions
export async function getQuestions(examId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*, options:question_options(*)")
    .eq("exam_id", examId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data;
}

export async function createQuestion(examId: string, questionData: {
  text: string;
  marks: number;
  options: { text: string; is_correct: boolean }[];
}) {
  const supabase = await createClient();

  // Get next order index
  const { count } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .eq("exam_id", examId);

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      exam_id: examId,
      text: questionData.text,
      marks: questionData.marks,
      order_index: (count || 0),
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Insert options
  const options = questionData.options.map((opt, index) => ({
    question_id: question.id,
    text: opt.text,
    is_correct: opt.is_correct,
    order_index: index,
  }));

  const { error: optionsError } = await supabase.from("question_options").insert(options);
  if (optionsError) return { error: optionsError.message };

  revalidatePath(`/lecturer/exams/${examId}/questions`);
  return { success: true, question };
}

export async function updateQuestion(id: string, examId: string, questionData: {
  text: string;
  marks: number;
  options: { id?: string; text: string; is_correct: boolean }[];
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("questions")
    .update({
      text: questionData.text,
      marks: questionData.marks,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  // Delete existing options and re-insert
  await supabase.from("question_options").delete().eq("question_id", id);

  const options = questionData.options.map((opt, index) => ({
    question_id: id,
    text: opt.text,
    is_correct: opt.is_correct,
    order_index: index,
  }));

  const { error: optionsError } = await supabase.from("question_options").insert(options);
  if (optionsError) return { error: optionsError.message };

  revalidatePath(`/lecturer/exams/${examId}/questions`);
  return { success: true };
}

export async function deleteQuestion(id: string, examId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("questions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/lecturer/exams/${examId}/questions`);
  return { success: true };
}

// Exam Student Assignment
export async function getExamStudents(examId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exam_students")
    .select("*, student:students(*, profile:profiles(*))")
    .eq("exam_id", examId);

  if (error) throw error;
  return data;
}

export async function assignStudents(examId: string, studentIds: string[]) {
  const supabase = await createClient();

  const assignments = studentIds.map((studentId) => ({
    exam_id: examId,
    student_id: studentId,
  }));

  const { error } = await supabase.from("exam_students").upsert(assignments, {
    onConflict: "exam_id,student_id",
  });

  if (error) return { error: error.message };
  revalidatePath(`/lecturer/exams/${examId}/students`);
  return { success: true };
}

export async function removeStudentFromExam(examId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("exam_students")
    .delete()
    .eq("exam_id", examId)
    .eq("student_id", studentId);

  if (error) return { error: error.message };
  revalidatePath(`/lecturer/exams/${examId}/students`);
  return { success: true };
}

// Student Exam Actions
export async function getStudentExams(studentId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exam_students")
    .select("*, exam:exams(*, course:courses(*))")
    .eq("student_id", studentId)
    .order("assigned_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function startExamAttempt(examId: string, studentId: string) {
  const supabase = await createClient();

  // Check if student already has an active attempt
  const { data: existingAttempt } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .eq("is_submitted", false)
    .single();

  if (existingAttempt) {
    return { success: true, attempt: existingAttempt };
  }

  // Check if student already submitted
  const { data: submittedAttempt } = await supabase
    .from("exam_attempts")
    .select("*")
    .eq("exam_id", examId)
    .eq("student_id", studentId)
    .eq("is_submitted", true)
    .single();

  if (submittedAttempt) {
    return { error: "You have already submitted this examination" };
  }

  // Create new attempt
  const { data: attempt, error } = await supabase
    .from("exam_attempts")
    .insert({
      exam_id: examId,
      student_id: studentId,
      started_at: new Date().toISOString(),
      is_submitted: false,
      violation_count: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    attempt_id: attempt.id,
    student_id: studentId,
    exam_id: examId,
    event_type: "EXAM_STARTED",
    metadata: { started_at: new Date().toISOString() },
  });

  return { success: true, attempt };
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  optionId: string | null
) {
  const supabase = await createClient();

  const { error } = await supabase.from("student_answers").upsert(
    {
      attempt_id: attemptId,
      question_id: questionId,
      option_id: optionId,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "attempt_id,question_id" }
  );

  if (error) return { error: error.message };
  return { success: true };
}

export async function submitExam(attemptId: string, isAutoSubmit = false) {
  const supabase = await createClient();

  // Get attempt
  const { data: attempt } = await supabase
    .from("exam_attempts")
    .select("*, exam:exams(*)")
    .eq("id", attemptId)
    .single();

  if (!attempt) return { error: "Attempt not found" };
  if (attempt.is_submitted) return { error: "Already submitted" };

  // Get all questions with correct answers
  const { data: questions } = await supabase
    .from("questions")
    .select("*, options:question_options(*)")
    .eq("exam_id", attempt.exam_id);

  // Get student answers
  const { data: answers } = await supabase
    .from("student_answers")
    .select("*, option:question_options(*)")
    .eq("attempt_id", attemptId);

  // Grade
  let correctAnswers = 0;
  let totalMarks = 0;
  let score = 0;

  for (const question of questions || []) {
    totalMarks += question.marks;
    const studentAnswer = answers?.find((a) => a.question_id === question.id);

    if (studentAnswer?.option_id) {
      const correctOption = question.options.find((o: any) => o.is_correct);
      if (correctOption && studentAnswer.option_id === correctOption.id) {
        correctAnswers++;
        score += question.marks;
      }
    }
  }

  const totalQuestions = questions?.length || 0;
  const incorrectAnswers = totalQuestions - correctAnswers;
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;

  // Update attempt
  await supabase
    .from("exam_attempts")
    .update({
      is_submitted: true,
      is_auto_submitted: isAutoSubmit,
      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId);

  // Create result
  const { error: resultError } = await supabase.from("results").insert({
    attempt_id: attemptId,
    student_id: attempt.student_id,
    exam_id: attempt.exam_id,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    incorrect_answers: incorrectAnswers,
    score,
    percentage: Math.round(percentage * 100) / 100,
    total_marks: totalMarks,
  });

  if (resultError) return { error: resultError.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    attempt_id: attemptId,
    student_id: attempt.student_id,
    exam_id: attempt.exam_id,
    event_type: isAutoSubmit ? "EXAM_AUTO_SUBMITTED" : "EXAM_SUBMITTED",
    metadata: { submitted_at: new Date().toISOString(), score, percentage },
  });

  revalidatePath("/student/results");
  return { success: true };
}

// Violation actions
export async function recordViolation(
  attemptId: string,
  studentId: string,
  examId: string,
  violationType: string,
  description: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient();

  const { error } = await supabase.from("violations").insert({
    attempt_id: attemptId,
    student_id: studentId,
    exam_id: examId,
    violation_type: violationType,
    description,
    metadata,
  });

  if (error) return { error: error.message };

  // Increment violation count on attempt
  await supabase.rpc("increment_violation_count", { attempt_id: attemptId });

  return { success: true };
}

export async function logActivity(
  attemptId: string | null,
  studentId: string | null,
  examId: string | null,
  eventType: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient();

  await supabase.from("activity_logs").insert({
    attempt_id: attemptId,
    student_id: studentId,
    exam_id: examId,
    event_type: eventType,
    metadata,
  });
}

// Results actions
export async function getResults(filters: {
  studentId?: string;
  examId?: string;
  lecturerId?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("results")
    .select("*, student:students(*, profile:profiles(*)), exam:exams(*, course:courses(*))")
    .order("created_at", { ascending: false });

  if (filters.studentId) {
    query = query.eq("student_id", filters.studentId);
  }
  if (filters.examId) {
    query = query.eq("exam_id", filters.examId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Dashboard stats
export async function getAdminStats() {
  const supabase = await createClient();

  const [
    { count: faculties },
    { count: departments },
    { count: lecturers },
    { count: students },
    { count: activeExams },
    { count: violations },
  ] = await Promise.all([
    supabase.from("faculties").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("lecturers").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }).in("status", ["published", "active"]),
    supabase.from("violations").select("*", { count: "exact", head: true }),
  ]);

  return {
    total_faculties: faculties || 0,
    total_departments: departments || 0,
    total_lecturers: lecturers || 0,
    total_students: students || 0,
    active_exams: activeExams || 0,
    recent_violations: violations || 0,
  };
}

export async function getLecturerStats(lecturerId: string) {
  const supabase = await createClient();

  const [
    { count: students },
    { count: courses },
    { count: activeExams },
    { count: upcomingExams },
    { count: results },
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: true }).eq("lecturer_id", lecturerId),
    supabase.from("courses").select("*", { count: "exact", head: true }).eq("lecturer_id", lecturerId),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("lecturer_id", lecturerId).eq("status", "active"),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("lecturer_id", lecturerId).eq("status", "scheduled"),
    supabase.from("results").select("*", { count: "exact", head: true }).eq("exam_id", 
      supabase.from("exams").select("id").eq("lecturer_id", lecturerId).limit(100) as any
    ),
  ]);

  return {
    total_students: students || 0,
    total_courses: courses || 0,
    active_exams: activeExams || 0,
    upcoming_exams: upcomingExams || 0,
    recent_results: results || 0,
  };
}

export async function getStudentStats(studentId: string) {
  const supabase = await createClient();

  const [
    { count: assigned },
    { count: results },
    { count: violations },
  ] = await Promise.all([
    supabase.from("exam_students").select("*", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("results").select("*", { count: "exact", head: true }).eq("student_id", studentId),
    supabase.from("violations").select("*", { count: "exact", head: true }).eq("student_id", studentId),
  ]);

  return {
    available_exams: assigned || 0,
    completed_exams: results || 0,
    recent_results: results || 0,
    total_violations: violations || 0,
  };
}

// CSV Question Import
export async function importQuestionsFromCSV(examId: string, questions: {
  text: string;
  marks: number;
  options: { text: string; is_correct: boolean }[];
}[]) {
  const results = [];

  for (const q of questions) {
    const result = await createQuestion(examId, q);
    results.push(result);
  }

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    return { error: `${errors.length} questions failed to import`, imported: results.length - errors.length };
  }

  return { success: true, imported: results.length };
}

// Bulk upload actions
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

export async function bulkCreateDepartments(
  csvText: string
): Promise<{ success?: boolean; created?: number; errors?: string[] }> {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { errors: ["No data rows found in CSV"] };

  const supabase = await createClient();
  const errors: string[] = [];
  let created = 0;

  // Fetch faculties to resolve names to IDs
  const { data: faculties } = await supabase.from("faculties").select("id, name, code");
  const facultyMap = new Map((faculties || []).map((f) => [f.name.toLowerCase(), f.id]));
  const facultyCodeMap = new Map((faculties || []).map((f) => [f.code.toLowerCase(), f.id]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = row["name"];
    const code = row["code"];
    const facultyName = row["faculty"] || row["faculty_name"] || "";
    const description = row["description"] || null;
    const status = row["status"] || "active";

    if (!name || !code) {
      errors.push(`Row ${i + 2}: Missing required fields (name, code)`);
      continue;
    }

    // Resolve faculty
    const facultyId =
      facultyMap.get(facultyName.toLowerCase()) ||
      facultyCodeMap.get(facultyName.toLowerCase());
    if (!facultyId) {
      errors.push(`Row ${i + 2}: Faculty "${facultyName}" not found`);
      continue;
    }

    const { error } = await supabase.from("departments").upsert(
      { name, code, faculty_id: facultyId, description: description || null, status },
      { onConflict: "code,faculty_id" }
    );

    if (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    } else {
      created++;
    }
  }

  revalidatePath("/admin/departments");
  if (errors.length > 0) return { errors, created };
  return { success: true, created };
}

export async function bulkCreateLecturers(
  csvText: string
): Promise<{ success?: boolean; created?: number; errors?: string[] }> {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { errors: ["No data rows found in CSV"] };

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const errors: string[] = [];
  let created = 0;

  // Fetch faculties and departments to resolve names to IDs
  const [{ data: faculties }, { data: departments }] = await Promise.all([
    supabase.from("faculties").select("id, name, code"),
    supabase.from("departments").select("id, name, code, faculty_id"),
  ]);
  const facultyMap = new Map((faculties || []).map((f) => [f.name.toLowerCase(), f]));
  const facultyCodeMap = new Map((faculties || []).map((f) => [f.code.toLowerCase(), f]));
  const deptMap = new Map((departments || []).map((d) => [d.name.toLowerCase(), d]));
  const deptCodeMap = new Map((departments || []).map((d) => [d.code.toLowerCase(), d]));

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fullName = row["full_name"] || row["name"] || "";
    const email = row["email"] || "";
    const staffId = row["staff_id"] || row["staffid"] || "";
    const departmentName = row["department"] || row["department_name"] || "";
    const facultyName = row["faculty"] || row["faculty_name"] || "";
    const password = row["password"] || `lecturer${Date.now().toString(36)}`;

    if (!fullName || !email || !staffId) {
      errors.push(`Row ${i + 2}: Missing required fields (full_name, email, staff_id)`);
      continue;
    }

    // Resolve faculty
    const faculty =
      facultyMap.get(facultyName.toLowerCase()) ||
      facultyCodeMap.get(facultyName.toLowerCase());
    if (!faculty) {
      errors.push(`Row ${i + 2}: Faculty "${facultyName}" not found`);
      continue;
    }

    // Resolve department
    const dept =
      deptMap.get(departmentName.toLowerCase()) ||
      deptCodeMap.get(departmentName.toLowerCase());
    if (!dept) {
      errors.push(`Row ${i + 2}: Department "${departmentName}" not found`);
      continue;
    }

    // Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "lecturer" },
    });

    if (authError) {
      errors.push(`Row ${i + 2}: ${authError.message}`);
      continue;
    }

    // Create profile explicitly
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role: "lecturer",
      status: "active",
    });
    if (profileError && profileError.code !== "23505") {
      errors.push(`Row ${i + 2}: Profile error - ${profileError.message}`);
      continue;
    }

    // Create lecturer record
    const { error: lectError } = await supabase.from("lecturers").insert({
      profile_id: authData.user.id,
      staff_id: staffId,
      department_id: dept.id,
      faculty_id: faculty.id,
      status: "active",
    });

    if (lectError) {
      errors.push(`Row ${i + 2}: ${lectError.message}`);
    } else {
      created++;
    }
  }

  revalidatePath("/admin/lecturers");
  if (errors.length > 0) return { errors, created };
  return { success: true, created };
}

export async function bulkCreateStudents(
  csvText: string
): Promise<{ success?: boolean; created?: number; errors?: string[] }> {
  const rows = parseCSV(csvText);
  if (rows.length === 0) return { errors: ["No data rows found in CSV"] };

  const supabase = await createClient();
  const adminClient = createAdminClient();
  const errors: string[] = [];
  let created = 0;

  // Fetch related data to resolve names to IDs
  const [{ data: faculties }, { data: departments }, { data: lecturers }] = await Promise.all([
    supabase.from("faculties").select("id, name, code"),
    supabase.from("departments").select("id, name, code, faculty_id"),
    supabase.from("lecturers").select("id, staff_id, profile:profiles(full_name)"),
  ]);
  const facultyMap = new Map((faculties || []).map((f) => [f.name.toLowerCase(), f]));
  const facultyCodeMap = new Map((faculties || []).map((f) => [f.code.toLowerCase(), f]));
  const deptMap = new Map((departments || []).map((d) => [d.name.toLowerCase(), d]));
  const deptCodeMap = new Map((departments || []).map((d) => [d.code.toLowerCase(), d]));
  const lecturerMap = new Map(
    (lecturers || []).map((l) => [l.staff_id.toLowerCase(), l])
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fullName = row["full_name"] || row["name"] || "";
    const email = row["email"] || "";
    const studentId = row["student_id"] || row["studentid"] || "";
    const departmentName = row["department"] || row["department_name"] || "";
    const facultyName = row["faculty"] || row["faculty_name"] || "";
    const lecturerStaffId = row["lecturer_staff_id"] || row["lecturer"] || "";
    const level = row["level"] || "100";

    if (!fullName || !email || !studentId) {
      errors.push(`Row ${i + 2}: Missing required fields (full_name, email, student_id)`);
      continue;
    }

    // Resolve faculty
    const faculty =
      facultyMap.get(facultyName.toLowerCase()) ||
      facultyCodeMap.get(facultyName.toLowerCase());
    if (!faculty) {
      errors.push(`Row ${i + 2}: Faculty "${facultyName}" not found`);
      continue;
    }

    // Resolve department
    const dept =
      deptMap.get(departmentName.toLowerCase()) ||
      deptCodeMap.get(departmentName.toLowerCase());
    if (!dept) {
      errors.push(`Row ${i + 2}: Department "${departmentName}" not found`);
      continue;
    }

    // Resolve lecturer
    const lecturer = lecturerMap.get(lecturerStaffId.toLowerCase());
    if (!lecturer) {
      errors.push(`Row ${i + 2}: Lecturer with staff_id "${lecturerStaffId}" not found`);
      continue;
    }

    // Create auth user
    const password = DEFAULT_STUDENT_PASSWORD;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: "student" },
    });

    if (authError) {
      errors.push(`Row ${i + 2}: ${authError.message}`);
      continue;
    }

    // Create profile explicitly
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: authData.user.id,
      full_name: fullName,
      email,
      role: "student",
      status: "active",
    });
    if (profileError && profileError.code !== "23505") {
      errors.push(`Row ${i + 2}: Profile error - ${profileError.message}`);
      continue;
    }

    // Create student record using admin client (bypasses RLS)
    const { error: studError } = await adminClient.from("students").insert({
      profile_id: authData.user.id,
      student_id: studentId,
      department_id: dept.id,
      faculty_id: faculty.id,
      lecturer_id: lecturer.id,
      level,
      status: "active",
    });

    if (studError) {
      errors.push(`Row ${i + 2}: ${studError.message}`);
    } else {
      created++;
    }
  }

  revalidatePath("/admin/students");
  if (errors.length > 0) return { errors, created };
  return { success: true, created };
}
