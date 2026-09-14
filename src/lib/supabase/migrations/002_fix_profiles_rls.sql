-- Fix: Create missing helper functions and fix profiles RLS + trigger
-- Run this in Supabase SQL Editor

-- 1. Create the missing helper functions (needed by RLS policies)
create or replace function get_user_role()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function get_lecturer_id()
returns uuid as $$
  select id from lecturers where profile_id = auth.uid();
$$ language sql security definer stable;

create or replace function get_student_id()
returns uuid as $$
  select id from students where profile_id = auth.uid();
$$ language sql security definer stable;

-- 2. Create the missing increment_violation_count RPC
create or replace function increment_violation_count(attempt_id uuid)
returns void as $$
begin
  update exam_attempts
  set violation_count = violation_count + 1
  where id = attempt_id;
end;
$$ language plpgsql security definer;

-- 3. Fix the trigger to bypass RLS
create or replace function handle_new_user()
returns trigger as $$
begin
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

-- 4. Ensure the trigger is set up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 5. Fix the RLS insert policy on profiles
drop policy if exists "Admins can insert profiles" on profiles;
create policy "Authenticated users can insert own profile" on profiles
  for insert with check (auth.uid() = id or get_user_role() = 'admin');

-- 6. Add missing admin INSERT policy for students
create policy "Admins can insert students" on students
  for insert with check (get_user_role() = 'admin');
