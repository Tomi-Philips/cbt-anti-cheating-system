-- Migration 003: Refactor to strict hierarchy (programmes, course_allocations, course_registrations)
-- Run this in Supabase SQL Editor.

-- 1. Programmes
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

-- 2. Courses: add level, semester, credit_unit, academic_session
alter table courses add column if not exists level text;
alter table courses add column if not exists semester text;
alter table courses add column if not exists credit_unit integer;
alter table courses add column if not exists academic_session text;

-- 3. Students: add programme_id
alter table students add column if not exists programme_id uuid references programmes(id) on delete set null;

-- 4. Exams: rename lecturer_id -> created_by_lecturer_id
alter table exams rename column lecturer_id to created_by_lecturer_id;

-- 5. Course allocations (composite key)
create table if not exists course_allocations (
  course_id uuid references courses(id) on delete cascade not null,
  lecturer_id uuid references lecturers(id) on delete cascade not null,
  academic_session text not null,
  semester text not null,
  created_at timestamptz default now(),
  primary key (course_id, lecturer_id, academic_session, semester)
);

-- 6. Course registrations (composite key)
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

-- 7. Backfill course_allocations from courses.lecturer_id
insert into course_allocations (course_id, lecturer_id, academic_session, semester)
select c.id, c.lecturer_id,
  coalesce(c.academic_session, '2026/2027'),
  coalesce(c.semester, 'First')
from courses c
where c.lecturer_id is not null
on conflict do nothing;

-- 8. Backfill exams.created_by_lecturer_id from exams.lecturer_id
update exams set created_by_lecturer_id = lecturer_id where created_by_lecturer_id is null and lecturer_id is not null;

-- 9. Drop direct lecturer FKs from students, courses, exams
alter table students drop column if exists lecturer_id;
alter table courses drop column if exists lecturer_id;
alter table exams drop column if exists lecturer_id;

-- 10. Drop obsolete indexes
drop index if exists idx_students_lecturer;
drop index if exists idx_courses_lecturer;
drop index if exists idx_exams_lecturer;

-- 11. Indexes for new tables
create index if not exists idx_programmes_department on programmes(department_id);
create index if not exists idx_allocations_course on course_allocations(course_id);
create index if not exists idx_allocations_lecturer on course_allocations(lecturer_id);
create index if not exists idx_registrations_student on course_registrations(student_id);
create index if not exists idx_registrations_course on course_registrations(course_id);

-- 12. Auto-enroll trigger: when a student is inserted/updated, register them
--    into every active course in their department at their level.
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

-- 13. Auto-enroll trigger: when a course is inserted/updated, register all
--    matching active students.
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

-- 14. RLS: course_allocations
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

-- 15. RLS: course_registrations
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

-- 16. Update timestamps triggers
create trigger update_programmes_updated_at before update on programmes
  for each row execute function update_updated_at();

create trigger update_allocations_updated_at before update on course_allocations
  for each row execute function update_updated_at();

create trigger update_registrations_updated_at before update on course_registrations
  for each row execute function update_updated_at();