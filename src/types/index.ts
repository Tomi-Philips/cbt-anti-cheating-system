export type Role = "admin" | "lecturer" | "student";

export type ExamStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "active"
  | "completed"
  | "closed";

export type ProfileStatus = "active" | "inactive" | "suspended";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  faculty_id: string;
  description: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  faculty?: Faculty;
}

export interface Lecturer {
  id: string;
  profile_id: string;
  staff_id: string;
  department_id: string;
  faculty_id: string;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  department?: Department;
  faculty?: Faculty;
}

export interface Student {
  id: string;
  profile_id: string;
  student_id: string;
  department_id: string;
  faculty_id: string;
  programme_id: string | null;
  level: string;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  department?: Department;
  faculty?: Faculty;
  programme?: Programme;
}

export interface Programme {
  id: string;
  department_id: string;
  name: string;
  code: string;
  duration_years: number;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  department_id: string;
  level: string;
  semester: string;
  credit_unit: number;
  academic_session: string;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface CourseAllocation {
  course_id: string;
  lecturer_id: string;
  academic_session: string;
  semester: string;
  created_at: string;
  course?: Course;
  lecturer?: Lecturer;
}

export interface CourseRegistration {
  student_id: string;
  course_id: string;
  academic_session: string;
  semester: string;
  status: string;
  registered_at: string;
  source: string;
  student?: Student;
  course?: Course;
}

export interface Exam {
  id: string;
  title: string;
  course_id: string;
  created_by_lecturer_id: string | null;
  instructions: string;
  duration_minutes: number;
  start_time: string | null;
  end_time: string | null;
  total_questions: number;
  total_marks: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  violation_threshold: number;
  status: ExamStatus;
  created_at: string;
  updated_at: string;
  course?: Course;
  lecturer?: Lecturer;
}

export interface Question {
  id: string;
  exam_id: string;
  text: string;
  marks: number;
  order_index: number;
  created_at: string;
  updated_at: string;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
  order_index: number;
  created_at: string;
}

export interface ExamStudent {
  id: string;
  exam_id: string;
  student_id: string;
  assigned_at: string;
  student?: Student;
  exam?: Exam;
}

export interface ExamAttempt {
  id: string;
  exam_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  is_submitted: boolean;
  is_auto_submitted: boolean;
  violation_count: number;
  created_at: string;
  exam?: Exam;
  student?: Student;
}

export interface StudentAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  option_id: string | null;
  answered_at: string;
  attempt?: ExamAttempt;
  question?: Question;
  option?: QuestionOption;
}

export interface Result {
  id: string;
  attempt_id: string;
  student_id: string;
  exam_id: string;
  total_questions: number;
  correct_answers: number;
  incorrect_answers: number;
  score: number;
  percentage: number;
  total_marks: number;
  created_at: string;
  attempt?: ExamAttempt;
  student?: Student;
  exam?: Exam;
}

export interface Violation {
  id: string;
  attempt_id: string;
  student_id: string;
  exam_id: string;
  violation_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
  attempt?: ExamAttempt;
  student?: Student;
  exam?: Exam;
}

export interface ActivityLog {
  id: string;
  attempt_id: string | null;
  student_id: string | null;
  exam_id: string | null;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Dashboard stats types
export interface AdminStats {
  total_faculties: number;
  total_departments: number;
  total_lecturers: number;
  total_students: number;
  active_exams: number;
  recent_violations: number;
}

export interface LecturerStats {
  total_students: number;
  total_courses: number;
  active_exams: number;
  upcoming_exams: number;
  recent_results: number;
  recent_activity: number;
}

export interface StudentStats {
  available_exams: number;
  upcoming_exams: number;
  completed_exams: number;
  recent_results: number;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}
