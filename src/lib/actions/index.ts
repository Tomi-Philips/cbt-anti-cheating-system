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
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const staffId = formData.get("staff_id") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;
  const status = (formData.get("status") as string) || "active";

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

  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: "lecturer",
      status,
    });

  if (profileError) {
    if (profileError.code !== "23505") {
      return { error: profileError.message };
    }
  }

  const { error } = await adminClient.from("lecturers").insert({
    profile_id: authData.user.id,
    staff_id: staffId,
    department_id: departmentId,
    faculty_id: facultyId,
    status,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/lecturers");
  return { success: true };
}

export async function updateLecturer(id: string, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const staffId = formData.get("staff_id") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;
  const status = (formData.get("status") as string) || "active";
  const profileId = formData.get("profile_id") as string;

  if (!profileId) {
    return { error: "Profile ID is required" };
  }

  const adminClient = createAdminClient();
  const authUpdates: {
    email?: string;
    password?: string;
    email_confirm?: boolean;
    user_metadata?: { full_name: string; role: "lecturer" };
  } = {
    user_metadata: { full_name: fullName, role: "lecturer" },
  };

  if (email) {
    authUpdates.email = email;
    authUpdates.email_confirm = true;
  }
  if (password) {
    authUpdates.password = password;
  }

  const { error: authError } = await adminClient.auth.admin.updateUserById(profileId, authUpdates);
  if (authError) return { error: authError.message };

  const { error: lecturerError } = await adminClient
    .from("lecturers")
    .update({
      staff_id: staffId,
      department_id: departmentId,
      faculty_id: facultyId,
      status,
    })
    .eq("id", id);

  if (lecturerError) return { error: lecturerError.message };

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      status,
    })
    .eq("id", profileId);

  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/lecturers");
  return { success: true };
}

export async function deleteLecturer(id: string, profileId: string) {
  const adminClient = createAdminClient();

  if (profileId) {
    const { error: authError } = await adminClient.auth.admin.deleteUser(profileId);
    if (authError) return { error: authError.message };
  }

  const { error } = await adminClient.from("lecturers").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/lecturers");
  return { success: true };
}

// Student actions
export async function getStudents(departmentId?: string, programmeId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("students")
    .select("*, profile:profiles(*), department:departments(*), faculty:faculties(*), programme:programmes(*)")
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }
  if (programmeId) {
    query = query.eq("programme_id", programmeId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createStudent(formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const studentId = formData.get("student_id") as string;
  const level = formData.get("level") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;
  const programmeId = (formData.get("programme_id") as string) || null;
  const status = (formData.get("status") as string) || "active";

  const password = DEFAULT_STUDENT_PASSWORD;

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

  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      full_name: fullName,
      email: email,
      role: "student",
      status,
    });

  if (profileError) {
    if (profileError.code !== "23505") {
      return { error: profileError.message };
    }
  }

  const { error } = await adminClient.from("students").insert({
    profile_id: authData.user.id,
    student_id: studentId,
    department_id: departmentId,
    faculty_id: facultyId,
    programme_id: programmeId,
    level,
    status,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  revalidatePath("/lecturer/students");
  return { success: true, defaultPassword: password };
}

export async function updateStudent(id: string, formData: FormData) {
  const email = formData.get("email") as string;
  const fullName = formData.get("full_name") as string;
  const studentId = formData.get("student_id") as string;
  const level = formData.get("level") as string;
  const departmentId = formData.get("department_id") as string;
  const facultyId = formData.get("faculty_id") as string;
  const programmeId = (formData.get("programme_id") as string) || null;
  const status = (formData.get("status") as string) || "active";
  const profileId = formData.get("profile_id") as string;

  if (!profileId) {
    return { error: "Profile ID is required" };
  }

  const adminClient = createAdminClient();
  const { error: authError } = await adminClient.auth.admin.updateUserById(profileId, {
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: "student" },
  });

  if (authError) return { error: authError.message };

  const { error: studentError } = await adminClient
    .from("students")
    .update({
      student_id: studentId,
      department_id: departmentId,
      faculty_id: facultyId,
      programme_id: programmeId,
      level,
      status,
    })
    .eq("id", id);

  if (studentError) return { error: studentError.message };

  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      status,
    })
    .eq("id", profileId);

  if (profileError) return { error: profileError.message };

  revalidatePath("/admin/students");
  revalidatePath("/lecturer/students");
  return { success: true };
}

export async function deleteStudent(id: string, profileId: string) {
  const adminClient = createAdminClient();

  if (profileId) {
    const { error: authError } = await adminClient.auth.admin.deleteUser(profileId);
    if (authError) return { error: authError.message };
  }

  const { error } = await adminClient.from("students").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/students");
  revalidatePath("/lecturer/students");
  return { success: true };
}

// Course actions
export async function getCourses(departmentId?: string, academicSession?: string, semester?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("courses")
    .select("*, department:departments(*)")
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }
  if (academicSession) {
    query = query.eq("academic_session", academicSession);
  }
  if (semester) {
    query = query.eq("semester", semester);
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
    level: formData.get("level") as string,
    semester: formData.get("semester") as string,
    credit_unit: parseInt(formData.get("credit_unit") as string) || 0,
    academic_session: formData.get("academic_session") as string,
    status: (formData.get("status") as string) || "active",
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { success: true };
}

export async function updateCourse(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("courses")
    .update({
      code: formData.get("code") as string,
      title: formData.get("title") as string,
      department_id: formData.get("department_id") as string,
      level: formData.get("level") as string,
      semester: formData.get("semester") as string,
      credit_unit: parseInt(formData.get("credit_unit") as string) || 0,
      academic_session: formData.get("academic_session") as string,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { success: true };
}

export async function deleteCourse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { success: true };
}

// Exam actions
export async function getExams(createdByLecturerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("exams")
    .select("*, course:courses(*), lecturer:lecturers(*, profile:profiles(*))")
    .order("created_at", { ascending: false });

  if (createdByLecturerId) {
    query = query.eq("created_by_lecturer_id", createdByLecturerId);
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
      created_by_lecturer_id: (formData.get("created_by_lecturer_id") as string) || null,
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
      const correctOption = question.options.find((o: { id: string; is_correct: boolean }) => o.is_correct);
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
    { count: programmes },
    { count: lecturers },
    { count: students },
    { count: courses },
    { count: activeExams },
    { count: violations },
  ] = await Promise.all([
    supabase.from("faculties").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("programmes").select("*", { count: "exact", head: true }),
    supabase.from("lecturers").select("*", { count: "exact", head: true }),
    supabase.from("students").select("*", { count: "exact", head: true }),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("exams").select("*", { count: "exact", head: true }).in("status", ["published", "active"]),
    supabase.from("violations").select("*", { count: "exact", head: true }),
  ]);

  return {
    total_faculties: faculties || 0,
    total_departments: departments || 0,
    total_programmes: programmes || 0,
    total_lecturers: lecturers || 0,
    total_students: students || 0,
    total_courses: courses || 0,
    active_exams: activeExams || 0,
    recent_violations: violations || 0,
  };
}

export async function getLecturerStats(lecturerId: string) {
  const supabase = await createClient();

  const [
    { count: courses },
    { count: activeExams },
    { count: upcomingExams },
    { count: results },
    { count: students },
  ] = await Promise.all([
    supabase.from("course_allocations").select("*", { count: "exact", head: true }).eq("lecturer_id", lecturerId),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("created_by_lecturer_id", lecturerId).eq("status", "active"),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("created_by_lecturer_id", lecturerId).eq("status", "scheduled"),
    supabase.from("results").select("*", { count: "exact", head: true }).eq("exam_id",
      supabase.from("exams").select("id").eq("created_by_lecturer_id", lecturerId).limit(100) as any
    ),
    supabase.from("course_registrations").select("*", { count: "exact", head: true }).eq("course_id",
      supabase.from("course_allocations").select("course_id").eq("lecturer_id", lecturerId) as any
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

// Programme actions
export async function getProgrammes(departmentId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("programmes")
    .select("*, department:departments(*)")
    .order("created_at", { ascending: false });

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createProgramme(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("programmes").insert({
    name: formData.get("name") as string,
    code: formData.get("code") as string,
    department_id: formData.get("department_id") as string,
    duration_years: parseInt(formData.get("duration_years") as string) || 4,
    status: (formData.get("status") as string) || "active",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A programme with this code already exists in this department" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/programmes");
  return { success: true };
}

export async function updateProgramme(id: string, formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("programmes")
    .update({
      name: formData.get("name") as string,
      code: formData.get("code") as string,
      department_id: formData.get("department_id") as string,
      duration_years: parseInt(formData.get("duration_years") as string) || 4,
      status: formData.get("status") as string,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/programmes");
  return { success: true };
}

export async function deleteProgramme(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("programmes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/programmes");
  return { success: true };
}

// Course allocation actions
export async function getAllocations(lecturerId?: string, courseId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("course_allocations")
    .select("*, course:courses(*, department:departments(*)), lecturer:lecturers(*, profile:profiles(*))")
    .order("created_at", { ascending: false });

  if (lecturerId) {
    query = query.eq("lecturer_id", lecturerId);
  }
  if (courseId) {
    query = query.eq("course_id", courseId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function allocateLecturer(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.from("course_allocations").insert({
    course_id: formData.get("course_id") as string,
    lecturer_id: formData.get("lecturer_id") as string,
    academic_session: formData.get("academic_session") as string,
    semester: formData.get("semester") as string,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This lecturer is already allocated to this course for this session" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/programmes");
  return { success: true };
}

export async function unallocateLecturer(courseId: string, lecturerId: string, academicSession: string, semester: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("course_allocations")
    .delete()
    .eq("course_id", courseId)
    .eq("lecturer_id", lecturerId)
    .eq("academic_session", academicSession)
    .eq("semester", semester);

  if (error) return { error: error.message };
  revalidatePath("/admin/courses");
  return { success: true };
}

// Course registration actions
export async function getRegistrations(studentId?: string, courseId?: string, lecturerId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("course_registrations")
    .select("*, student:students(*, profile:profiles(*)), course:courses(*, department:departments(*))")
    .order("registered_at", { ascending: false });

  if (studentId) {
    query = query.eq("student_id", studentId);
  }
  if (courseId) {
    query = query.eq("course_id", courseId);
  }
  if (lecturerId) {
    query = query.eq("course_id",
      supabase.from("course_allocations").select("course_id").eq("lecturer_id", lecturerId) as any
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function syncCourseRegistrations(courseId?: string) {
  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select("id, department_id, level, academic_session, semester, status")
    .eq("status", "active");

  if (courseId) {
    query = query.eq("id", courseId);
  }

  const { data: courses, error: coursesError } = await query;
  if (coursesError) return { error: coursesError.message };

  const adminClient = createAdminClient();
  let inserted = 0;

  for (const course of courses || []) {
    if (!course.department_id || !course.level || !course.academic_session || !course.semester) continue;

    const { data: students, error: studentsError } = await adminClient
      .from("students")
      .select("id")
      .eq("status", "active")
      .eq("department_id", course.department_id)
      .eq("level", course.level);

    if (studentsError) return { error: studentsError.message };

    const rows = (students || []).map((s) => ({
      student_id: s.id,
      course_id: course.id,
      academic_session: course.academic_session,
      semester: course.semester,
      source: "auto" as const,
    }));

    if (rows.length === 0) continue;

    const { error: insertError, count } = await adminClient
      .from("course_registrations")
      .upsert(rows, { onConflict: "student_id,course_id,academic_session,semester" });

    if (insertError) return { error: insertError.message };
    inserted += count || rows.length;
  }

  revalidatePath("/admin/courses");
  revalidatePath("/admin/students");
  return { success: true, inserted };
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
  const [{ data: faculties }, { data: departments }, { data: programmes }] = await Promise.all([
    supabase.from("faculties").select("id, name, code"),
    supabase.from("departments").select("id, name, code, faculty_id"),
    supabase.from("programmes").select("id, name, code, department_id"),
  ]);
  const facultyMap = new Map((faculties || []).map((f) => [f.name.toLowerCase(), f]));
  const facultyCodeMap = new Map((faculties || []).map((f) => [f.code.toLowerCase(), f]));
  const deptMap = new Map((departments || []).map((d) => [d.name.toLowerCase(), d]));
  const deptCodeMap = new Map((departments || []).map((d) => [d.code.toLowerCase(), d]));
  const programmeMap = new Map(
    (programmes || []).map((p) => [p.name.toLowerCase(), p])
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fullName = row["full_name"] || row["name"] || "";
    const email = row["email"] || "";
    const studentId = row["student_id"] || row["studentid"] || "";
    const departmentName = row["department"] || row["department_name"] || "";
    const facultyName = row["faculty"] || row["faculty_name"] || "";
    const programmeName = row["programme"] || row["programme_name"] || "";
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

    // Resolve programme
    let programmeId: string | null = null;
    if (programmeName) {
      const prog = programmeMap.get(programmeName.toLowerCase());
      if (prog) programmeId = prog.id;
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
      programme_id: programmeId,
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
