-- CBT Anti-Cheating System Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (common user data)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin', 'lecturer', 'student')),
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Faculties
create table if not exists faculties (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Departments
create table if not exists departments (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null,
  faculty_id uuid references faculties(id) on delete cascade not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(code, faculty_id)
);

-- Lecturers
create table if not exists lecturers (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  staff_id text not null unique,
  department_id uuid references departments(id) on delete cascade not null,
  faculty_id uuid references faculties(id) on delete cascade not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Programmes (degree track run by a department)
create table if not exists programmes (
  id uuid default uuid_generate_v4() primary key,
  department_id uuid references departments(id) on delete cascade not null,
  name text not null,
  code text not null,
  duration_years integer not null default 4 check (duration_years between 1 and 8),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(code, department_id)
);

-- Students
create table if not exists students (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references profiles(id) on delete cascade not null,
  student_id text not null unique,
  department_id uuid references departments(id) on delete cascade not null,
  faculty_id uuid references faculties(id) on delete cascade not null,
  programme_id uuid references programmes(id) on delete set null,
  level text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Courses
create table if not exists courses (
  id uuid default uuid_generate_v4() primary key,
  code text not null,
  title text not null,
  department_id uuid references departments(id) on delete cascade not null,
  level text not null,
  semester text not null,
  credit_unit integer not null default 0,
  academic_session text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(code, department_id, academic_session, semester)
);

-- Course Allocations (lecturer → course per session)
create table if not exists course_allocations (
  course_id uuid references courses(id) on delete cascade not null,
  lecturer_id uuid references lecturers(id) on delete cascade not null,
  academic_session text not null,
  semester text not null,
  created_at timestamptz default now(),
  primary key (course_id, lecturer_id, academic_session, semester)
);

-- Course Registrations (student → course per session, derived)
create table if not exists course_registrations (
  student_id uuid references students(id) on delete cascade not null,
  course_id uuid references courses(id) on delete cascade not null,
  academic_session text not null,
  semester text not null,
  status text not null default 'enrolled' check (status in ('enrolled', 'withdrawn', 'completed')),
  registered_at timestamptz default now(),
  source text not null default 'auto' check (source in ('auto', 'manual')),
  primary key (student_id, course_id, academic_session, semester)
);

-- Exams
create table if not exists exams (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  course_id uuid references courses(id) on delete cascade not null,
  created_by_lecturer_id uuid references lecturers(id) on delete set null,
  instructions text not null default '',
  duration_minutes integer not null default 60,
  start_time timestamptz,
  end_time timestamptz,
  total_questions integer not null default 0,
  total_marks integer not null default 0,
  randomize_questions boolean not null default false,
  randomize_options boolean not null default false,
  violation_threshold integer not null default 3,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published', 'active', 'completed', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Questions
create table if not exists questions (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references exams(id) on delete cascade not null,
  text text not null,
  marks integer not null default 1,
  order_index integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Question Options
create table if not exists question_options (
  id uuid default uuid_generate_v4() primary key,
  question_id uuid references questions(id) on delete cascade not null,
  text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz default now()
);

-- Exam Students (assignment)
create table if not exists exam_students (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references exams(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  assigned_at timestamptz default now(),
  unique(exam_id, student_id)
);

-- Exam Attempts
create table if not exists exam_attempts (
  id uuid default uuid_generate_v4() primary key,
  exam_id uuid references exams(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  is_submitted boolean not null default false,
  is_auto_submitted boolean not null default false,
  violation_count integer not null default 0,
  created_at timestamptz default now()
);

-- Student Answers
create table if not exists student_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references exam_attempts(id) on delete cascade not null,
  question_id uuid references questions(id) on delete cascade not null,
  option_id uuid references question_options(id) on delete set null,
  answered_at timestamptz default now(),
  unique(attempt_id, question_id)
);

-- Results
create table if not exists results (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references exam_attempts(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  exam_id uuid references exams(id) on delete cascade not null,
  total_questions integer not null,
  correct_answers integer not null,
  incorrect_answers integer not null,
  score numeric not null,
  percentage numeric not null,
  total_marks integer not null,
  created_at timestamptz default now()
);

-- Violations
create table if not exists violations (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references exam_attempts(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  exam_id uuid references exams(id) on delete cascade not null,
  violation_type text not null,
  description text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Activity Logs
create table if not exists activity_logs (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references exam_attempts(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  exam_id uuid references exams(id) on delete set null,
  event_type text not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_email on profiles(email);
create index if not exists idx_departments_faculty on departments(faculty_id);
create index if not exists idx_lecturers_department on lecturers(department_id);
create index if not exists idx_lecturers_faculty on lecturers(faculty_id);
create index if not exists idx_students_department on students(department_id);
create index if not exists idx_students_programme on students(programme_id);
create index if not exists idx_courses_department on courses(department_id);
create index if not exists idx_courses_level on courses(level);
create index if not exists idx_exams_created_by on exams(created_by_lecturer_id);
create index if not exists idx_exams_course on exams(course_id);
create index if not exists idx_exams_status on exams(status);
create index if not exists idx_questions_exam on questions(exam_id);
create index if not exists idx_question_options_question on question_options(question_id);
create index if not exists idx_exam_students_exam on exam_students(exam_id);
create index if not exists idx_exam_students_student on exam_students(student_id);
create index if not exists idx_exam_attempts_exam on exam_attempts(exam_id);
create index if not exists idx_exam_attempts_student on exam_attempts(student_id);
create index if not exists idx_student_answers_attempt on student_answers(attempt_id);
create index if not exists idx_results_student on results(student_id);
create index if not exists idx_results_exam on results(exam_id);
create index if not exists idx_violations_attempt on violations(attempt_id);
create index if not exists idx_violations_student on violations(student_id);
create index if not exists idx_activity_logs_attempt on activity_logs(attempt_id);
create index if not exists idx_programmes_department on programmes(department_id);
create index if not exists idx_allocations_course on course_allocations(course_id);
create index if not exists idx_allocations_lecturer on course_allocations(lecturer_id);
create index if not exists idx_registrations_student on course_registrations(student_id);
create index if not exists idx_registrations_course on course_registrations(course_id);

-- RLS Policies
alter table profiles enable row level security;
alter table faculties enable row level security;
alter table departments enable row level security;
alter table lecturers enable row level security;
alter table students enable row level security;
alter table courses enable row level security;
alter table exams enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table exam_students enable row level security;
alter table exam_attempts enable row level security;
alter table student_answers enable row level security;
alter table results enable row level security;
alter table violations enable row level security;
alter table activity_logs enable row level security;

-- Helper function to get user role
create or replace function get_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

-- Helper function to get lecturer id from profile
create or replace function get_lecturer_id()
returns uuid as $$
  select id from lecturers where profile_id = auth.uid();
$$ language sql security definer stable;

-- Helper function to get student id from profile
create or replace function get_student_id()
returns uuid as $$
  select id from students where profile_id = auth.uid();
$$ language sql security definer stable;

-- RPC function to increment violation count on exam attempts
create or replace function increment_violation_count(attempt_id uuid)
returns void as $$
begin
  update exam_attempts
  set violation_count = violation_count + 1
  where id = attempt_id;
end;
$$ language plpgsql security definer;

-- Profiles: users can read their own, admins can read all
create policy "Users can view own profile" on profiles
  for select using (id = auth.uid());

create policy "Admins can view all profiles" on profiles
  for select using (get_user_role() = 'admin');

create policy "Authenticated users can insert own profile" on profiles
  for insert with check (auth.uid() = id or get_user_role() = 'admin');

create policy "Admins can update any profile" on profiles
  for update using (get_user_role() = 'admin');

create policy "Users can update own profile" on profiles
  for update using (id = auth.uid());

-- Faculties: everyone can read, admin can manage
create policy "Authenticated users can view faculties" on faculties
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage faculties" on faculties
  for all using (get_user_role() = 'admin');

-- Departments: everyone can read, admin can manage
create policy "Authenticated users can view departments" on departments
  for select using (auth.role() = 'authenticated');

create policy "Admins can manage departments" on departments
  for all using (get_user_role() = 'admin');

-- Lecturers: admin can manage, lecturers can view own
create policy "Admins can manage lecturers" on lecturers
  for all using (get_user_role() = 'admin');

create policy "Lecturers can view own record" on lecturers
  for select using (profile_id = auth.uid());

create policy "Admins can view all lecturers" on lecturers
  for select using (get_user_role() = 'admin');

-- Students: admin can manage, students view own, lecturers view via allocations
create policy "Admins can manage students" on students
  for all using (get_user_role() = 'admin');

create policy "Students can view own record" on students
  for select using (profile_id = auth.uid());

create policy "Lecturers can view students in their courses" on students
  for select using (
    get_user_role() = 'lecturer' and
    id in (
      select cr.student_id from course_registrations cr
      join course_allocations ca on ca.course_id = cr.course_id
      where ca.lecturer_id = get_lecturer_id()
    )
  );

-- Courses: admin can manage, students view enrolled courses, lecturers view allocated courses
create policy "Admins can manage courses" on courses
  for all using (get_user_role() = 'admin');

create policy "Students can view courses they are enrolled in" on courses
  for select using (
    get_user_role() = 'student' and
    id in (select course_id from course_registrations where student_id = get_student_id())
  );

create policy "Lecturers can view allocated courses" on courses
  for select using (
    get_user_role() = 'lecturer' and
    id in (select course_id from course_allocations where lecturer_id = get_lecturer_id())
  );

-- Exams: lecturer manages allocated course exams, students see published assigned
create policy "Lecturers can manage exams for allocated courses" on exams
  for all using (
    get_user_role() = 'lecturer' and
    created_by_lecturer_id = get_lecturer_id()
  );

create policy "Admins can view all exams" on exams
  for select using (get_user_role() = 'admin');

create policy "Students can view assigned published exams" on exams
  for select using (
    get_user_role() = 'student' and
    status in ('published', 'active') and
    id in (select exam_id from exam_students where student_id = get_student_id())
  );

-- Questions: lecturer manages via allocated course exams
create policy "Lecturers can manage questions for own exams" on questions
  for all using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Students can view questions during active attempts" on questions
  for select using (
    get_user_role() = 'student' and
    exam_id in (
      select ea.exam_id from exam_attempts ea
      join exam_students es on es.exam_id = ea.exam_id
      where es.student_id = get_student_id()
    )
  );

-- Question Options: same as questions
create policy "Lecturers can manage options for own exam questions" on question_options
  for all using (
    get_user_role() = 'lecturer' and
    question_id in (
      select q.id from questions q
      join exams e on e.id = q.exam_id
      where e.created_by_lecturer_id = get_lecturer_id()
    )
  );

create policy "Students can view options during active attempts" on question_options
  for select using (
    get_user_role() = 'student' and
    question_id in (
      select q.id from questions q
      join exam_attempts ea on ea.exam_id = q.exam_id
      where ea.student_id = get_student_id() and not ea.is_submitted
    )
  );

-- Exam Students: lecturer manages, students view own
create policy "Lecturers can manage exam assignments" on exam_students
  for all using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Students can view own assignments" on exam_students
  for select using (
    get_user_role() = 'student' and
    student_id = get_student_id()
  );

-- Exam Attempts: students manage own, lecturer views, admin views all
create policy "Students can create and update own attempts" on exam_attempts
  for all using (
    get_user_role() = 'student' and
    student_id = get_student_id()
  );

create policy "Lecturers can view attempts for own exams" on exam_attempts
  for select using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Admins can view all attempts" on exam_attempts
  for select using (get_user_role() = 'admin');

-- Student Answers: students manage own, lecturer views via exam
create policy "Students can manage own answers" on student_answers
  for all using (
    get_user_role() = 'student' and
    attempt_id in (select id from exam_attempts where student_id = get_student_id())
  );

create policy "Lecturers can view answers for own exams" on student_answers
  for select using (
    get_user_role() = 'lecturer' and
    attempt_id in (
      select ea.id from exam_attempts ea
      join exams e on e.id = ea.exam_id
      where e.created_by_lecturer_id = get_lecturer_id()
    )
  );

-- Results: students view own, lecturer views exam results, admin views all
create policy "Students can view own results" on results
  for select using (
    get_user_role() = 'student' and
    student_id = get_student_id()
  );

create policy "Lecturers can view results for own exams" on results
  for select using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Admins can view all results" on results
  for select using (get_user_role() = 'admin');

create policy "System can insert results" on results
  for insert with check (auth.role() = 'authenticated');

-- Violations: student sees own, lecturer sees exam violations, admin all
create policy "Students can view own violations" on violations
  for select using (
    get_user_role() = 'student' and
    student_id = get_student_id()
  );

create policy "Lecturers can view violations for own exams" on violations
  for select using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Admins can view all violations" on violations
  for select using (get_user_role() = 'admin');

create policy "Authenticated users can insert violations" on violations
  for insert with check (auth.role() = 'authenticated');

-- Activity Logs
create policy "Students can view own activity logs" on activity_logs
  for select using (
    get_user_role() = 'student' and
    student_id = get_student_id()
  );

create policy "Lecturers can view activity for own exams" on activity_logs
  for select using (
    get_user_role() = 'lecturer' and
    exam_id in (select id from exams where created_by_lecturer_id = get_lecturer_id())
  );

create policy "Admins can view all activity logs" on activity_logs
  for select using (get_user_role() = 'admin');

create policy "Authenticated users can insert activity logs" on activity_logs
  for insert with check (auth.role() = 'authenticated');

-- Function to handle new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  -- Temporarily become superuser to bypass RLS
  perform set_config('role', 'postgres', true);
  insert into profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student')
  );
  return new;
exception
  when others then
    raise warning 'handle_new_user trigger failed: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Function to update timestamps
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Add update triggers
create trigger update_profiles_updated_at before update on profiles
  for each row execute function update_updated_at();
create trigger update_faculties_updated_at before update on faculties
  for each row execute function update_updated_at();
create trigger update_departments_updated_at before update on departments
  for each row execute function update_updated_at();
create trigger update_lecturers_updated_at before update on lecturers
  for each row execute function update_updated_at();
create trigger update_students_updated_at before update on students
  for each row execute function update_updated_at();
create trigger update_courses_updated_at before update on courses
  for each row execute function update_updated_at();
create trigger update_exams_updated_at before update on exams
  for each row execute function update_updated_at();
create trigger update_questions_updated_at before update on questions
  for each row execute function update_updated_at();

-- RLS: course_allocations
alter table course_allocations enable row level security;

create policy "Admins can manage allocations" on course_allocations
  for all using (get_user_role() = 'admin');

create policy "Lecturers can view own allocations" on course_allocations
  for select using (lecturer_id = get_lecturer_id());

create policy "Students can view allocations for their courses" on course_allocations
  for select using (
    get_user_role() = 'student' and
    course_id in (select course_id from course_registrations where student_id = get_student_id())
  );

-- RLS: course_registrations
alter table course_registrations enable row level security;

create policy "Admins can manage registrations" on course_registrations
  for all using (get_user_role() = 'admin');

create policy "Students can view own registrations" on course_registrations
  for select using (student_id = get_student_id());

create policy "Lecturers can view registrations for their courses" on course_registrations
  for select using (
    get_user_role() = 'lecturer' and
    course_id in (select course_id from course_allocations where lecturer_id = get_lecturer_id())
  );

create policy "System can insert registrations" on course_registrations
  for insert with check (auth.role() = 'authenticated');

-- Auto-enroll trigger: when a student is inserted/updated, register them
-- into every active course in their department at their level.
create or replace function sync_course_registrations_for_student()
returns trigger security definer as $$
declare
  v_dept uuid;
  v_level text;
  v_status text;
begin
  v_dept := coalesce(new.department_id, old.department_id);
  v_level := coalesce(new.level, old.level);
  v_status := coalesce(new.status, old.status);

  if v_status = 'active' and v_dept is not null and v_level is not null then
    insert into course_registrations (student_id, course_id, academic_session, semester, source)
    select new.id, c.id, c.academic_session, c.semester, 'auto'
    from courses c
    where c.status = 'active'
      and c.department_id = v_dept
      and c.level = v_level
      and c.academic_session is not null
      and c.semester is not null
    on conflict (student_id, course_id, academic_session, semester) do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_student_registrations on students;
create trigger trg_sync_student_registrations
  after insert or update of department_id, level, status on students
  for each row execute function sync_course_registrations_for_student();

-- Auto-enroll trigger: when a course is inserted/updated, register all
-- matching active students.
create or replace function sync_course_registrations_for_course()
returns trigger security definer as $$
declare
  v_dept uuid;
  v_level text;
  v_session text;
  v_semester text;
  v_status text;
begin
  v_dept := coalesce(new.department_id, old.department_id);
  v_level := coalesce(new.level, old.level);
  v_session := coalesce(new.academic_session, old.academic_session);
  v_semester := coalesce(new.semester, old.semester);
  v_status := coalesce(new.status, old.status);

  if v_status = 'active' and v_dept is not null and v_level is not null
     and v_session is not null and v_semester is not null then
    insert into course_registrations (student_id, course_id, academic_session, semester, source)
    select s.id, new.id, v_session, v_semester, 'auto'
    from students s
    where s.status = 'active'
      and s.department_id = v_dept
      and s.level = v_level
    on conflict (student_id, course_id, academic_session, semester) do nothing;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_sync_course_registrations on courses;
create trigger trg_sync_course_registrations
  after insert or update of department_id, level, status, academic_session, semester on courses
  for each row execute function sync_course_registrations_for_course();

-- Update timestamps triggers for new tables
create trigger update_programmes_updated_at before update on programmes
  for each row execute function update_updated_at();

create trigger update_allocations_updated_at before update on course_allocations
  for each row execute function update_updated_at();

create trigger update_registrations_updated_at before update on course_registrations
  for each row execute function update_updated_at();
