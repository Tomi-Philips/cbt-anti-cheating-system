# MASTER SOFTWARE DEVELOPMENT SPECIFICATION

## PROJECT TITLE

**Design and Implementation of a Computer Based Test (CBT) Examination System with Anti-Cheating Features**

---

# 1. PROJECT OVERVIEW

Build a complete, functional, secure, modern web based Computer Based Test examination system designed for a tertiary educational institution.

The system is not simply an online quiz application. It is an institutional examination management platform with a clear academic hierarchy, controlled examination access, automated assessment, and integrated anti-cheating mechanisms.

The system must support three distinct user roles:

1. **Admin**
2. **Lecturer**
3. **Student**

The institutional structure must follow this hierarchy:

**Admin → Faculty → Department → Lecturer → Student**

Examinations are managed through lecturers:

**Lecturer → Course → Examination → Questions → Assigned Students → Examination Attempt → Result**

The Admin is the general overseer of the institution's examination environment. The Admin creates and manages faculties, departments, and lecturer accounts.

Lecturers belong to specific departments and are responsible for adding and managing their students, creating examinations, uploading examination questions, assigning examinations to students, monitoring examination activities, and reviewing results within their permitted academic scope.

Students are examination candidates. They can only access examinations assigned to them and can only view information belonging to their own account.

The central purpose of the system is:

> **To provide a reliable and secure CBT environment for conducting examinations while reducing opportunities for examination malpractice through practical anti-cheating mechanisms, activity monitoring, controlled examination access, and automated assessment.**

Do not turn this into a generic school management system.

Do not add unrelated school management features.

Do not build a social platform.

Do not build an AI chatbot.

Do not build unnecessary SaaS functionality.

Everything must support the examination workflow.

---

# 2. AIM OF THE PROJECT

The aim of this project is to design and implement a secure Computer Based Test examination system with integrated anti-cheating features that supports examination administration, controlled student assessment, automated grading, and improved examination integrity.

The system should provide administrators and lecturers with effective tools for managing academic examinations while providing students with a focused and secure environment for taking computer based tests.

---

# 3. PROJECT OBJECTIVES

The system must achieve the following objectives:

### Objective 1: Institutional Academic Structure

Provide an organized structure for managing faculties, departments, lecturers, and students.

### Objective 2: Role-Based Access

Provide secure and clearly separated access for Admin, Lecturer, and Student users.

### Objective 3: Lecturer Student Management

Allow lecturers to add and manage students assigned to their department and academic responsibility.

### Objective 4: Examination Management

Allow lecturers to create, configure, publish, and manage examinations.

### Objective 5: Question Management

Allow lecturers to create and upload examination questions, answer options, correct answers, and marks.

### Objective 6: Controlled Examination Access

Ensure that only students assigned to an examination can access and take it.

### Objective 7: Automated Assessment

Automatically grade objective examination questions and generate accurate results.

### Objective 8: Anti-Cheating

Implement practical mechanisms for detecting, discouraging, recording, and responding to suspicious examination activities.

### Objective 9: Activity Monitoring

Record relevant examination events such as tab switching, fullscreen exit, answer changes, submission, and other configured violations.

### Objective 10: Examination Integrity

Provide lecturers and administrators with sufficient examination records and violation information to support the monitoring and review of examination activities.

---

# 4. MOST IMPORTANT ARCHITECTURAL PRINCIPLE

The three user roles must NOT be treated as interchangeable.

The system must enforce clear responsibilities.

## ADMIN

The Admin is the **general system and academic structure overseer**.

The Admin manages:

* Faculties
* Departments
* Lecturers
* Lecturer accounts
* Institution-wide examination information
* System-wide users
* Examination monitoring
* Results oversight
* Violation oversight
* System settings where necessary

The Admin does not normally add individual students.

Student creation is primarily the responsibility of lecturers.

---

# 5. LECTURER

The Lecturer is responsible for academic examination management within their assigned department.

A lecturer belongs to:

**One Faculty + One Department**

The lecturer can:

* Add students
* View students under their responsibility
* Manage student information
* Create courses where permitted
* Create examinations
* Create examination questions
* Upload questions
* Define correct answers
* Set examination duration
* Schedule examinations
* Assign students
* Publish examinations
* Monitor examination attempts
* Review results
* Review examination violations related to their examinations

A lecturer must never have unrestricted access to another department's students or examinations.

---

# 6. STUDENT

The Student is the examination candidate.

The student can:

* Log in
* View profile
* View assigned examinations
* Read examination instructions
* Start an examination
* Answer questions
* Navigate questions
* Change answers before submission
* Submit examination
* Receive automatically calculated results where configured
* View permitted examination history

The student cannot:

* Create exams
* Create questions
* Add students
* Modify scores
* View other students
* Access lecturer pages
* Access admin pages
* Modify examination settings

---

# 7. ACADEMIC HIERARCHY

The system must accurately represent:

```text
ADMIN
   │
   ├── FACULTY
   │      │
   │      ├── DEPARTMENT
   │      │      │
   │      │      ├── LECTURER
   │      │      │      │
   │      │      │      ├── STUDENT
   │      │      │      ├── STUDENT
   │      │      │      └── STUDENT
   │      │      │
   │      │      └── LECTURER
   │      │
   │      └── DEPARTMENT
   │
   └── FACULTY
```

The database and authorization system must enforce this hierarchy.

Do not simply display this hierarchy visually while storing unrelated records underneath.

The actual relationships must exist in the database.

---

# 8. EXAMINATION HIERARCHY

The examination structure should be:

```text
FACULTY
   ↓
DEPARTMENT
   ↓
LECTURER
   ↓
COURSE
   ↓
EXAMINATION
   ↓
QUESTIONS
   ↓
ASSIGNED STUDENTS
   ↓
EXAMINATION ATTEMPT
   ↓
ANSWERS
   ↓
ANTI-CHEATING EVENTS
   ↓
RESULT
```

This should form the core business logic of the application.

---

# 9. CORE DATABASE ENTITIES

Use PostgreSQL through Supabase.

The core entities should include:

```text
profiles
faculties
departments
lecturers
students
courses
exams
questions
question_options
exam_students
exam_attempts
student_answers
results
violations
activity_logs
```

Do not create unnecessary tables.

---

# 10. PROFILES

The common user profile should contain information such as:

```text
id
full_name
email
role
status
created_at
updated_at
```

Roles:

```text
admin
lecturer
student
```

Authentication should be handled through Supabase Auth.

Profile and authorization information should be protected appropriately.

---

# 11. FACULTIES

The Admin should be able to create:

* Faculty name
* Faculty code
* Description where necessary
* Status

Example:

```text
Faculty of Computing
Faculty of Engineering
Faculty of Business
```

The system should prevent duplicate faculty codes.

---

# 12. DEPARTMENTS

Departments belong to faculties.

For example:

```text
Faculty of Computing
    ├── Computer Science
    ├── Information Technology
    └── Computer Engineering
```

Each department should reference its parent faculty.

---

# 13. LECTURER MANAGEMENT

Only authorized Admin users should create lecturer accounts.

When creating a lecturer, the Admin should specify:

* Full name
* Staff ID
* Email
* Faculty
* Department
* Account status

The Admin must assign the lecturer to a legitimate department.

The system should not allow a lecturer to belong to a department outside their faculty.

---

# 14. STUDENT MANAGEMENT

Students should primarily be created by lecturers.

When a lecturer creates a student, the system should automatically associate the student with the lecturer's:

* Faculty
* Department

The lecturer should not be able to manually select another unrelated faculty or department.

Student information may include:

* Full name
* Student ID
* Email
* Level
* Faculty
* Department
* Lecturer
* Account status

---

# 15. COURSE MANAGEMENT

Courses should belong to the appropriate academic department.

A course may contain:

```text
Course Code
Course Title
Department
Lecturer
Status
```

Example:

```text
CSC 301
Database Management Systems
Computer Science
Dr. Ade
```

---

# 16. EXAMINATION CREATION

Lecturers should have a proper examination creation workflow.

The process should be:

```text
Create Examination
       ↓
Select Course
       ↓
Enter Examination Information
       ↓
Add Questions
       ↓
Configure Duration
       ↓
Configure Schedule
       ↓
Select Students
       ↓
Review
       ↓
Publish
```

The system should not publish an incomplete examination.

---

# 17. EXAMINATION CONFIGURATION

An examination should support:

* Examination title
* Course
* Instructions
* Duration
* Start date/time
* End date/time
* Number of questions
* Marks
* Assigned students
* Question randomization
* Option randomization
* Violation threshold
* Examination status

Possible statuses:

```text
Draft
Scheduled
Published
Active
Completed
Closed
```

---

# 18. QUESTION MANAGEMENT

Lecturers should be able to create questions manually.

At minimum support objective questions such as:

* Multiple choice
* Single correct answer

Each question should have:

```text
Question text
Options
Correct answer
Marks
Exam
```

The lecturer should be able to:

* Add question
* Edit question
* Delete question
* Reorder questions where appropriate
* Search questions
* Preview questions

---

# 19. QUESTION UPLOAD

Where practical, support question upload through a structured format such as CSV.

The upload process should:

1. Accept file
2. Validate structure
3. Preview questions
4. Identify invalid records
5. Allow correction or cancellation
6. Import valid questions

Do not silently import malformed questions.

---

# 20. STUDENT ASSIGNMENT

A lecturer should determine which students can take an examination.

Use an explicit relationship:

```text
exam_students
```

This means an examination is not automatically available to every student in the department.

The lecturer may:

* Select individual students
* Select a defined student group where implemented
* Remove students before publication

Once an examination is active, assignment changes should be restricted appropriately.

---

# 21. STUDENT DASHBOARD

The student dashboard should remain simple.

It should show real information such as:

```text
Available Examinations
Upcoming Examinations
Completed Examinations
Recent Results
```

Do not create ten dashboard cards.

Do not create fake statistics.

If the student has no examination, show an appropriate empty state.

---

# 22. LECTURER DASHBOARD

The lecturer dashboard should focus on academic responsibilities.

Useful dynamic information:

```text
My Students
My Courses
My Active Exams
Upcoming Exams
Recent Results
Recent Examination Activity
```

Everything must be retrieved from real database data.

---

# 23. ADMIN DASHBOARD

The Admin dashboard should provide institution-wide oversight.

Useful dynamic metrics:

```text
Total Faculties
Total Departments
Total Lecturers
Total Students
Active Examinations
Recent Violations
```

The Admin should be able to drill down:

```text
Faculty
  ↓
Department
  ↓
Lecturer
  ↓
Students
  ↓
Examinations
```

---

# 24. EXAMINATION INSTRUCTIONS

Before beginning an examination, students should see:

* Examination title
* Course
* Duration
* Number of questions
* Instructions
* Anti-cheating rules
* Start button

The rules should explain that activities such as leaving the examination window or exiting fullscreen may be recorded.

Keep the instructions concise.

---

# 25. EXAMINATION INTERFACE

The examination interface is the most important student screen.

It should be distraction free.

Display:

```text
Exam title
Course
Timer
Question number
Question
Answer options
Navigation
Submit button
```

Example:

```text
CSC 301
Database Management Systems

Time Remaining
42:18

Question 8 of 40

What is a primary key?

○ A unique identifier for a record
○ A duplicated database field
○ A backup table
○ A database password

Previous                         Next
```

This is only an example. Actual content must come from the database.

---

# 26. TIMER

The examination timer must be functional.

Requirements:

* Countdown
* Warning when time is low
* Accurate expiration
* Server-side validation
* Automatic submission when time expires

Never trust only the browser timer.

The server should validate whether an attempt is still within its allowed examination period.

---

# 27. ANSWER PERSISTENCE

Answers should be saved progressively.

Do not wait until final submission.

When a student answers a question:

```text
Student
   ↓
Select answer
   ↓
Save answer
   ↓
Associate with attempt
   ↓
Continue examination
```

If the browser refreshes, previously saved answers should be recoverable where technically appropriate.

---

# 28. QUESTION RANDOMIZATION

Support random question ordering.

Support random answer option ordering.

The system must preserve the actual correct answer internally.

Randomization must happen securely and consistently for the individual examination attempt.

---

# 29. ANTI-CHEATING SYSTEM

Anti-cheating is a core part of the project.

The system should implement practical browser-level monitoring and deterrence.

The objective is not to falsely claim that cheating is impossible.

The objective is to:

**Prevent + Discourage + Detect + Record + Respond**

to suspicious examination behaviour.

---

# 30. TAB SWITCH DETECTION

Detect when the examination page loses visibility/focus.

When detected:

```text
Record event
      ↓
Record timestamp
      ↓
Associate with attempt
      ↓
Increase violation count
      ↓
Warn student
```

Example warning:

```text
Examination Warning

You have left the examination window.

This activity has been recorded.

Violation 1 of 3
```

Do not automatically terminate an examination after one accidental event unless configured to do so.

---

# 31. FULLSCREEN MONITORING

Request fullscreen when an examination begins.

If the student exits fullscreen:

* Record event
* Warn student
* Increase violation count
* Request fullscreen again where technically possible

The behaviour must be clearly explained before the exam begins.

---

# 32. COPY AND PASTE CONTROL

During the examination:

* Restrict copying
* Restrict pasting
* Restrict unnecessary context menus

These mechanisms should be treated as deterrents.

Do not claim that JavaScript can make web content completely impossible to copy.

---

# 33. KEYBOARD RESTRICTIONS

Where technically appropriate, restrict common shortcuts associated with attempting to access browser tools.

Examples include:

```text
Ctrl + C
Ctrl + V
Ctrl + X
Ctrl + U
F12
Ctrl + Shift + I
```

Do not rely on these mechanisms as the primary security system.

---

# 34. ACTIVITY LOGGING

Record meaningful examination events.

Examples:

```text
EXAM_STARTED
QUESTION_VIEWED
ANSWER_SELECTED
ANSWER_CHANGED
TAB_SWITCH
FULLSCREEN_EXIT
COPY_ATTEMPT
PASTE_ATTEMPT
EXAM_SUBMITTED
EXAM_AUTO_SUBMITTED
TIME_EXPIRED
```

Each event should contain relevant information such as:

```text
attempt_id
student_id
exam_id
event_type
timestamp
metadata
```

Do not generate meaningless logs.

---

# 35. VIOLATION MANAGEMENT

Create a dedicated violation record.

Example:

```text
Student: John Doe
Examination: CSC 301
Violation: Tab Switch
Time: 10:43:22
Attempt: A10291
```

Lecturers should be able to review violations for their own examinations.

Admins should be able to oversee violations institution-wide.

---

# 36. AUTOMATIC SUBMISSION

The system should support automatic submission when:

* Examination time expires
* Configured violation threshold is exceeded
* The examination is legitimately terminated by the system

When possible, inform the student before termination.

Once submitted:

**The attempt becomes immutable.**

The student cannot continue answering.

---

# 37. AUTOMATED GRADING

Objective questions should be automatically graded.

Calculate:

* Total questions
* Correct answers
* Incorrect answers
* Score
* Percentage

All scoring should happen server side.

Do not accept a score submitted by the browser.

---

# 38. RESULT MANAGEMENT

Students should see only their own permitted results.

Lecturers should see results belonging to their examinations.

Admins should have institution-wide oversight.

Results may contain:

```text
Student
Course
Examination
Score
Percentage
Correct
Incorrect
Submission time
Status
```

---

# 39. EXAMINATION ATTEMPT REVIEW

Lecturers and Admins should be able to inspect examination attempts according to their permissions.

An attempt should show:

* Student
* Examination
* Start time
* Submission time
* Duration
* Score
* Violations
* Activity history

This creates an auditable examination process.

---

# 40. SECURITY AND AUTHORIZATION

Security is not optional.

Implement:

* Supabase Authentication
* PostgreSQL Row Level Security
* Server-side authorization
* Role validation
* Server-side examination validation
* Server-side score calculation
* Protected routes
* Secure environment variables

Never trust client-provided:

```text
role
student_id
lecturer_id
score
exam status
violation count
submission time
```

Validate sensitive operations on the server.

---

# 41. ROLE-SPECIFIC ACCESS

A lecturer must never be able to manipulate:

```text
Another lecturer's students
Another lecturer's examinations
Another department's records
Admin settings
```

A student must never access:

```text
Admin dashboard
Lecturer dashboard
Question management
Examination creation
Other student results
```

The Admin has institution-wide oversight.

---

# 42. VISUAL DESIGN PHILOSOPHY

The UI must look like a **real professional institutional product**.

The design should be:

* Modern
* Elegant
* Minimal
* Mature
* Professional
* Functional
* Consistent
* Calm
* Trustworthy

Think of a well designed academic or enterprise product.

Do not design it like a trendy startup landing page.

---

# 43. COLOUR SYSTEM

Use a restrained colour palette.

Prefer:

* White
* Off-white
* Neutral gray
* Dark charcoal
* One strong primary brand colour
* Very limited semantic colours for success, warning, and errors

Do not use colour riot.

Do not make every card colourful.

Do not use random gradients.

Do not use neon colours.

Do not use excessive purple-blue AI aesthetics.

The interface should look good primarily because of:

**Typography + spacing + hierarchy + layout + consistency.**

---

# 44. UI COMPONENT STYLE

Use:

* Clean cards
* Subtle borders
* Moderate shadows
* Consistent radius
* Strong typography
* Clear buttons
* Proper forms
* Professional tables
* Good empty states
* Clear confirmation dialogs

Avoid:

* Giant rounded containers
* Excessive glassmorphism
* Floating blobs
* Decorative gradients
* Excessive shadows
* Huge icons
* Random illustrations

---

# 45. NO AI-GENERATED DESIGN VIBES

This is a strict requirement.

Do not use:

```text
✨ AI Powered
🚀 Smart Platform
⚡ Next Generation
🧠 Intelligent System
🔥 Powerful Analytics
```

as decorative labels.

Do not add unnecessary badges.

Do not use "AI" terminology unless the actual implemented functionality requires it.

Do not add random icons beside every heading.

Do not use generic dashboard copy such as:

> "Welcome back! Here's what's happening with your learning journey."

Use direct institutional language.

For example:

> **Lecturer Dashboard**

> **Upcoming Examinations**

> **Student Records**

> **Examination Results**

Simple and professional.

---

# 46. NO STATIC FILLER CONTENT

This is critical.

Do not create:

* Fake students
* Fake examinations
* Fake results
* Fake activity
* Fake charts
* Fake notifications
* Fake statistics
* Fake testimonials
* Fake announcements

If there is no data, show an intelligent empty state.

Example:

```text
No examinations available

Published examinations assigned to you will appear here.
```

This is better than filling the interface with meaningless content.

---

# 47. DYNAMIC-FIRST DEVELOPMENT

Every important section must connect to real functionality.

Bad:

```text
Admin Dashboard
Students: 1,284
Lecturers: 86
Exams: 34
```

with hardcoded values.

Good:

```text
Database
   ↓
Query
   ↓
Server
   ↓
Dashboard
```

The dashboard should update when actual records change.

The same principle applies to:

* Students
* Lecturers
* Faculties
* Departments
* Courses
* Exams
* Questions
* Results
* Violations
* Activities

---

# 48. SEARCH, FILTERING AND PAGINATION

Where datasets become large, implement:

* Search
* Filtering
* Pagination
* Sorting where useful

Examples:

Lecturer student list:

```text
Search student
Filter by level
Filter by status
```

Admin lecturer list:

```text
Search lecturer
Filter faculty
Filter department
```

Examinations:

```text
Search examination
Filter course
Filter status
```

Do not add filters that serve no practical purpose.

---

# 49. EMPTY STATES

Empty states must be useful.

Example:

```text
No students found

Students added under your academic responsibility will appear here.
```

Not:

```text
Nothing here yet 😊
```

Keep language professional.

---

# 50. LOADING AND ERROR STATES

Every asynchronous operation should have:

* Loading state
* Success state
* Error state
* Empty state

Forms should show useful validation errors.

Do not let users click buttons repeatedly while an operation is processing.

---

# 51. RESPONSIVE DESIGN

The administrative and lecturer portals should work properly on:

* Desktop
* Laptop
* Tablet

The examination environment should prioritize:

* Desktop
* Laptop

because this is a CBT system.

Do not simply shrink the desktop design.

Design responsive behaviour intentionally.

---

# 52. ACCESSIBILITY

Use:

* Semantic HTML
* Proper labels
* Keyboard focus
* Accessible form controls
* Good contrast
* Readable text
* Clear error messages

Do not sacrifice usability for aesthetics.

---

# 53. ANIMATION

Animation must be subtle.

Acceptable:

* Modal transitions
* Dropdown transitions
* Toast notifications
* Button loading states
* Small page transitions

Avoid:

* Floating elements
* Bouncing cards
* Constant movement
* Excessive parallax
* Decorative animation

The product should feel stable and trustworthy.

---

# 54. ADMIN NAVIGATION

The Admin navigation should contain only meaningful sections:

```text
Dashboard

Academic Structure
  Faculties
  Departments

Users
  Lecturers
  Students

Examinations
Results
Violations
Activity Logs

Settings
```

Do not add unrelated navigation items.

---

# 55. LECTURER NAVIGATION

The Lecturer navigation should contain:

```text
Dashboard

Students
Courses
Examinations

Results
Violations

Profile
```

If a section has no data or is not relevant to the lecturer, handle it intelligently rather than filling the navigation unnecessarily.

---

# 56. STUDENT NAVIGATION

Keep the student navigation minimal:

```text
Dashboard
Examinations
Results
Profile
```

The student should not feel like they are navigating a complicated administration system.

---

# 57. PROFESSIONAL TABLE DESIGN

Tables will be heavily used.

They should have:

* Clear column headings
* Proper spacing
* Search
* Pagination where necessary
* Row actions
* Responsive behaviour
* Empty states
* Loading states

Do not put five unnecessary action buttons in every row.

Use a simple action menu where appropriate.

---

# 58. FORM DESIGN

Forms should be clean and structured.

Group related fields.

Use clear labels.

Show validation immediately where appropriate.

Avoid putting twenty fields into one giant form.

For complex operations such as examination creation, use a multi-step workflow if it improves usability.

---

# 59. EXAM CREATION UX

A lecturer should feel guided through the process.

Recommended:

```text
1. Basic Information
2. Questions
3. Settings
4. Students
5. Review
6. Publish
```

The lecturer should be able to move backward and forward without losing entered information.

---

# 60. EXAMINATION EXPERIENCE

The exam interface should be visually different from the administration portal.

It should be calmer.

Remove unnecessary menus.

Focus attention on:

```text
Timer
Question
Answers
Progress
Navigation
Submit
```

This is an examination environment, not a dashboard.

---

# 61. EXAM SECURITY UI

Security warnings should be:

* Clear
* Calm
* Direct

Do not use dramatic red screens for every violation.

Example:

> **Examination Warning**
>
> You have left the examination window. This activity has been recorded.

This is better than:

> 🚨🚨 CHEATING DETECTED!!! 🚨🚨

The system should distinguish between a recorded violation and confirmed cheating.

A tab switch is evidence of a suspicious event, not necessarily proof of cheating.

---

# 62. DATABASE RELATIONSHIPS

The relationships should be logically enforced.

Example:

```text
Faculty
   has many Departments

Department
   belongs to Faculty
   has many Lecturers
   has many Students
   has many Courses

Lecturer
   belongs to Department
   manages Students
   manages Courses
   creates Examinations

Course
   belongs to Department
   may be assigned to Lecturer
   has Examinations

Exam
   belongs to Lecturer
   belongs to Course
   has Questions
   has Assigned Students
   has Attempts

Attempt
   belongs to Student
   belongs to Exam
   has Answers
   has Violations
   produces Result
```

---

# 63. IMPORTANT DATA OWNERSHIP RULE

The system must understand ownership.

If Lecturer A creates an examination:

```text
Lecturer A
   ↓
Exam A
```

Lecturer B must not automatically see or modify Exam A.

Likewise:

```text
Lecturer A
   ↓
Student A
```

Lecturer B should not automatically manage Student A.

This must be enforced through server authorization and database Row Level Security.

---

# 64. ANTI-CHEATING LIMITATIONS

Do not pretend that a normal browser based application can provide absolute examination security.

Browser based mechanisms can detect and discourage certain behaviours, but they cannot guarantee that a student has no second device or external physical assistance.

The project should therefore honestly position the system as:

**A CBT system with integrated anti-cheating detection and deterrence mechanisms.**

Not:

**A 100% cheat-proof system.**

This distinction is academically and technically important.

---

# 65. FEATURES THAT MUST NOT BE ADDED

Unless explicitly requested later, do not add:

* Chat
* Messaging
* Social feed
* Student forum
* AI chatbot
* AI tutor
* Cryptocurrency
* Payment gateway
* Subscription system
* Blog
* News section
* Gamification
* Leaderboards
* Points
* Rewards
* Unrelated attendance system
* Hostel management
* Library management
* Payroll
* School fees
* Result prediction
* Course recommendation engine
* Unrelated analytics
* Marketing pages

This project is specifically about:

**CBT + Examination Management + Anti-Cheating + Assessment.**

Stay within that scope.

---

# 66. LEAST IMPORTANT BUT NECESSARY FEATURES

The smallest features should still improve usability.

Examples:

* Profile editing
* Logout
* Password management
* Search
* Pagination
* Confirmation dialogs
* Toast messages
* Loading states
* Empty states
* Error states
* Exam status indicators
* Basic activity history

These should remain secondary to the core examination workflow.

---

# 67. TECHNICAL STACK

Use:

### Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS
* Lucide React

### Backend

* Next.js Server Actions and/or Route Handlers
* Supabase

### Database

* PostgreSQL through Supabase

### Authentication

* Supabase Auth

### Validation

* Zod
* React Hook Form where appropriate

### Notifications

* Sonner or an equivalent lightweight notification system

Do not introduce unnecessary libraries.

---

# 68. CODE ARCHITECTURE

Use a clean structure such as:

```text
src/
│
├── app/
│   ├── (public)/
│   ├── auth/
│   ├── admin/
│   ├── lecturer/
│   ├── student/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── admin/
│   ├── lecturer/
│   ├── student/
│   ├── exam/
│   └── shared/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── validation/
│   └── utils/
│
├── services/
│   ├── students/
│   ├── lecturers/
│   ├── exams/
│   ├── questions/
│   ├── results/
│   └── violations/
│
├── hooks/
├── types/
└── constants/
```

Do not put the entire application into a few enormous files.

---

# 69. SERVER-FIRST SECURITY

Whenever security or sensitive data is involved, prefer server-side logic.

For example:

```text
Student submits exam
        ↓
Server validates attempt
        ↓
Server retrieves correct answers
        ↓
Server calculates score
        ↓
Server creates result
        ↓
Server closes attempt
```

Do not send correct answers to the browser in a way that makes them trivially accessible before submission.

---

# 70. PERFORMANCE

The system should be designed to handle realistic institutional usage.

Use:

* Pagination
* Indexed database fields
* Efficient queries
* Server-side filtering
* Lazy loading where useful
* Proper caching where appropriate

Do not fetch every student in the institution just to display a count.

Use database aggregation/count queries.

---

# 71. REAL-TIME CONSIDERATIONS

Real-time behaviour should only be implemented where useful.

Examples:

* Examination monitoring
* Active examination attempts
* Violation updates

Do not add real-time functionality everywhere just because Supabase supports it.

---

# 72. TESTING

Test the actual workflows.

### Admin

* Login
* Create faculty
* Create department
* Add lecturer
* Assign lecturer
* Disable lecturer

### Lecturer

* Login
* Add student
* View students
* Create course
* Create examination
* Add questions
* Assign students
* Publish exam
* View results
* View violations

### Student

* Login
* View assigned exams
* Start exam
* Answer questions
* Change answers
* Switch tab
* Exit fullscreen
* Submit
* Auto-submit
* View result

### Security

Test:

* Unauthorized routes
* Unauthorized database access
* Student accessing lecturer URL
* Lecturer accessing another lecturer's data
* Manipulated exam ID
* Manipulated student ID
* Score manipulation
* Duplicate submission
* Expired examination attempt

---

# 73. UI QUALITY STANDARD

Before considering a page complete, ask:

### Does this page have a real purpose?

### Is every element necessary?

### Is the information hierarchy obvious?

### Is the page using real data?

### Does the page handle loading?

### Does it handle empty data?

### Does it handle errors?

### Does it work on different screen sizes?

### Does it look like one coherent product?

### Does anything feel like decorative AI-generated content?

If yes, remove or redesign it.

---

# 74. FINAL PRODUCT STANDARD

The final application should feel like a product that a serious tertiary institution could realistically use.

When the Admin logs in, the system should communicate:

> **Institution-wide control and oversight.**

When a Lecturer logs in:

> **Academic and examination management.**

When a Student logs in:

> **A focused and secure examination environment.**

The three experiences should feel related but clearly different.

---

# 75. FINAL DESIGN DIRECTIVE

Do not attempt to impress the user by adding more features.

**Impress the user by making the necessary features exceptionally well designed and functional.**

The project should have:

* Excellent typography
* Excellent spacing
* Excellent hierarchy
* Consistent components
* Clean navigation
* Professional forms
* Strong table design
* Clear examination interface
* Reliable database operations
* Proper authorization
* Meaningful anti-cheating mechanisms
* Accurate results
* Real dynamic data
* Thoughtful empty states
* Clear error handling

Avoid visual noise.

Avoid feature bloat.

Avoid generic AI design patterns.

Avoid unnecessary badges.

Avoid unnecessary labels.

Avoid fake content.

Avoid excessive colours.

Avoid excessive animations.

Avoid unnecessary gradients.

Avoid unnecessary rounded cards.

Avoid unnecessary static sections.

---

# 76. THE CORE USER JOURNEY

The final system should make this journey possible:

```text
ADMIN
  ↓
Creates Faculty
  ↓
Creates Department
  ↓
Adds Lecturer
  ↓
Assigns Lecturer to Department
  ↓
LECTURER
  ↓
Adds Students
  ↓
Creates/Manages Course
  ↓
Creates Examination
  ↓
Adds Questions
  ↓
Configures Examination
  ↓
Assigns Students
  ↓
Publishes Examination
  ↓
STUDENT
  ↓
Logs In
  ↓
Views Assigned Examination
  ↓
Reads Instructions
  ↓
Starts Examination
  ↓
Anti-Cheating Monitoring Begins
  ↓
Answers Questions
  ↓
Suspicious Activities Are Recorded
  ↓
Student Submits
  ↓
System Grades Examination
  ↓
RESULT GENERATED
  ↓
LECTURER REVIEWS RESULT
  ↓
ADMIN HAS OVERALL OVERSIGHT
```

This workflow is the **heart of the entire software**.

Build around it.

Do not allow secondary features to distract from it.

---

# FINAL INSTRUCTION TO THE AI CODER

Treat this as a **real software engineering project**, not a UI generation exercise.

First understand the business rules, role hierarchy, data relationships, security boundaries, examination workflow, and anti-cheating requirements.

Then implement the database and authorization architecture.

Then implement the core workflows.

Then build the UI around those workflows.

Do not create beautiful screens that are disconnected from the actual backend.

Do not create fake functionality.

Do not use hardcoded records as a substitute for database integration.

Do not create placeholder features and call them complete.

Do not add features outside the defined scope.

The final application should be **simple, classic, professional, beautiful, secure, responsive, dynamic, and genuinely functional**.

It should look like a carefully designed institutional examination product created by an experienced UI/UX designer and software engineering team.

**The goal is not to make the system look complicated. The goal is to make a relatively focused system feel exceptionally well made.**
