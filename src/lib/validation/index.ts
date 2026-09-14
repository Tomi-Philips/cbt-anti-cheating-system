import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string(),
  role: z.enum(["admin", "lecturer", "student"]),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const facultySchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required").max(10, "Code must be at most 10 characters"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const departmentSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().min(2, "Code is required").max(10, "Code must be at most 10 characters"),
  faculty_id: z.string().min(1, "Faculty is required"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const lecturerSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  staff_id: z.string().min(2, "Staff ID is required"),
  department_id: z.string().min(1, "Department is required"),
  faculty_id: z.string().min(1, "Faculty is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const studentSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  student_id: z.string().min(2, "Student ID is required"),
  level: z.string().min(1, "Level is required"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const courseSchema = z.object({
  code: z.string().min(2, "Course code is required"),
  title: z.string().min(2, "Course title is required"),
  department_id: z.string().min(1, "Department is required"),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const examSchema = z.object({
  title: z.string().min(2, "Title is required"),
  course_id: z.string().min(1, "Course is required"),
  instructions: z.string().min(10, "Instructions are required"),
  duration_minutes: z.number().min(5, "Duration must be at least 5 minutes").max(300, "Duration cannot exceed 300 minutes"),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  randomize_questions: z.boolean().default(false),
  randomize_options: z.boolean().default(false),
  violation_threshold: z.number().min(1).max(20).default(3),
  total_marks: z.number().min(1).default(0),
  total_questions: z.number().min(0).default(0),
  status: z.enum(["draft", "scheduled", "published", "active", "completed", "closed"]).default("draft"),
});

export const questionSchema = z.object({
  text: z.string().min(5, "Question text is required"),
  marks: z.number().min(1, "Marks must be at least 1").default(1),
  options: z.array(z.object({
    text: z.string().min(1, "Option text is required"),
    is_correct: z.boolean(),
  })).min(2, "At least 2 options are required").max(6, "Maximum 6 options allowed"),
}).refine((data) => data.options.some((o) => o.is_correct), {
  message: "At least one correct answer is required",
  path: ["options"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type FacultyInput = z.infer<typeof facultySchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type LecturerInput = z.infer<typeof lecturerSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ExamInput = z.infer<typeof examSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
