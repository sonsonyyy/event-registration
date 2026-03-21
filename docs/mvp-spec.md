# Church Event Registration Application - MVP Specification

## Goal
Build a district event registration application that supports both onsite registration and church-based online registration, while introducing department-aware access control for privileged accounts and events.

Online registrants continue to upload a receipt or proof of payment instead of paying through the system.

---

## 1. Scope Summary

The MVP will support:
- Event setup and fee configuration
- District / section / department / pastor master data
- User and role management
- Church representative access requests
- Onsite registration
- Online registration per church / pastor
- Receipt upload and verification
- S3-backed receipt storage for online registration uploads
- In-app workflow notifications
- Capacity tracking, reservation, and registration limits
- Reports by event, section, and department
- Historical archiving through soft deletes

---

## 2. Access Model

### 2.1 Authorization Axes
Permissions must always be evaluated by combining:
- `role`
- `territorial scope`
- `department scope`
- `action type`

Position/title remains metadata only and must not grant authority.

### 2.2 Geographic Scope
- District
- Section
- Church / Pastor

### 2.3 Department Scope
Supported departments:
- Youth Ministries
- Ladies Ministries
- Apostolic Men's
- Sunday School
- Home Missions
- Music Commission
- Information Technology Commission

Department matching must be strict:
- If a user belongs to a department, they only match records and events in that same department
- If a user has no department, they only match records and events with no department
- No-department is not a wildcard
- A general / no-department account is only for general / no-department records

### 2.4 Position Metadata
Titles such as `President`, `Director`, `Presbyter`, and `Secretary` are not roles. They are descriptive metadata on user accounts.

---

## 3. User Roles

### Super Admin
Full deployment access.

**Permissions**
- All system configuration
- All event, user, and master data management
- All access approvals
- All registration verification
- All reports

**Rules**
- Must not be assigned to any district, section, department, or pastor
- No position/title is required
- Global override always applies first

### Admin
District-scoped reviewer and operator.

**Scope**
- Must belong to one district
- May belong to exactly one department or no department
- Must not be assigned to a pastor
- Must not be treated as section-scoped

**Permissions**
- Manage users
- Manage districts, sections, departments, pastors/churches
- Manage district-wide events and fee categories inside matching district and department scope
- Post onsite registrations for district-wide events inside matching district and department scope
- Verify online registrations for district-wide events inside matching district and department scope
- View district-level reports

**Rules**
- No-department admins only match no-department district events
- Department admins only match district events in the same department
- Admins do not manage sectional events
- Admins do not process account requests in this ruleset

---

### Manager
Section-scoped reviewer and operator.

**Scope**
- Must belong to one section
- May belong to exactly one department or no department
- Must not be assigned to a pastor

**Permissions**
- Manage sectional events and fee categories inside matching section and department scope
- Process account requests for churches in the same section
- Post onsite registrations for churches in the same section when the event matches allowed scope
- Verify online registrations for churches in the same section when the event matches allowed scope
- View section-level reports

**Rules**
- No-department managers only match no-department section events
- Department managers only match section events in the same department
- Managers may assist with district-wide registration workflows for their own section, but that does not make them managers of the district-wide event record

---

### Registration Staff
Operational onsite encoder.

**Permissions**
- Create onsite registrations
- Search pastors/churches
- View event availability

**Rules**
- Scope depends on assigned district, optional section, and optional department
- Must not be assigned to a pastor
- No position/title is required
- Cannot manage event records
- Can only post registrations within explicitly assigned scope

---

### Registrant
Church representative account tied to one pastor/church.

**Permissions**
- Sign in
- Submit online registrations
- Upload payment proof
- View registration history and status

**Rules**
- Registrant accounts are not department-based
- Each church may have up to two registrant accounts
- Each registrant may submit only for the assigned pastor/church

---

## 4. Event Model

### 4.1 Event Ownership Types
The MVP must support:
- District event under a department
- Sectional event under a department
- District event with no department
- Sectional event with no department

### 4.2 Event Access Rules
Managing an event is a separate action from viewing it or helping with registration.

- District event under a department:
  - managed by `Super Admin` or an `Admin` in the same district and same department
- District event with no department:
  - managed by `Super Admin` or a no-department `Admin` in the same district
- Sectional event under a department:
  - managed by `Super Admin` or a `Manager` in the same section and same department
- Sectional event with no department:
  - managed by `Super Admin` or a no-department `Manager` in the same section
- Managers may view district-wide events for workflow purposes when allowed by separate registration rules, but they do not manage the district-wide event record
- Admins may view sectional events for workflow purposes when allowed by separate registration rules, but they do not manage the sectional event record
- Registration Staff and Registrants cannot manage events
- Same department does not automatically mean same authority

### 4.3 Event Fields
- Event name
- Description
- Date from
- Date to
- Venue
- Registration opening date
- Registration closing date
- Status (`Draft`, `Open`, `Closed`, `Completed`, `Cancelled`)
- Total capacity
- Remaining slots (computed)
- Owning district
- Scope type (`district`, `section`)
- Section assignment (nullable, required for sectional events)
- Department assignment (nullable)

### 4.3.1 Event Ownership Storage Rules
- Every event stores `district_id`
- District-wide events store `district_id` and keep `section_id` null
- Sectional events store both `section_id` and the matching `district_id` from that section
- Territorial authorization, event management, verification, onsite posting, reporting, and dashboard visibility must rely on stored event district ownership instead of inferring district scope from registrations
- Non-superadmin event forms must prefill and lock actor-owned scope fields:
  - `Admin` defaults to district-wide scope, assigned district, and assigned department or no-department lane
  - `Manager` defaults to sectional scope, assigned district, assigned section, and assigned department or no-department lane

### 4.4 Capacity Reservation Rules
- `Pending Verification` registrations consume event and fee-category capacity
- `Needs Correction` registrations continue to reserve capacity while awaiting resubmission
- `Verified` registrations continue to consume capacity
- `Rejected` registrations release capacity
- Cancelled registrations release capacity
- Onsite registrations consume capacity immediately when saved
- Homepage availability uses the same reservation logic as registration forms and dashboards

### 4.5 Fee Categories
Each event can have multiple fee categories, for example:
- `Regular (Online)`
- `Regular (Onsite)`
- `One-day Pass`

Fee fields:
- Category name
- Amount
- Optional slot allocation
- Active status

---

## 5. Master Data Modules

### Districts
Fields:
- Name
- Description (optional)
- Status

### Sections
Fields:
- District
- Name
- Description (optional)
- Status

### Departments
Fields:
- Name
- Description (optional)
- Status

### Pastors / Churches
Fields:
- Section
- Pastor full name
- Church name
- Contact number
- Email (optional)
- Address (optional)
- Status

Archived records must remain available for historical reporting and future audit features.

---

## 6. User Management Module

### User Fields
- Full name
- Email
- Password
- Role
- District assignment (nullable)
- Section assignment (nullable)
- Department assignment (nullable)
- Pastor assignment (nullable, registrant only)
- Position/title (nullable)
- Status (`Active`, `Inactive`)

### Role Assignment Rules
- `Super Admin`: unrestricted, no territorial or department assignment
- `Admin`: district-scoped only, optional department
- `Manager`: section-scoped only, optional department
- `Registration Staff`: operational scope only
- `Registrant`: pastor/church scoped only

### Important Rule
Do not use one generic permission rule for everything. Keep separate rules for:
- manage event
- view event
- post onsite registration
- verify online registration
- process account request
- generate report

---

## 7. Church Access Request Module

### Functions
- Request church representative access
- Assign request to a pastor/church
- Approve request
- Reject request

### Approval Authority
- Super Admin
- Manager

### Business Rules
- Account requests are section-scoped
- Managers may approve or reject only when they are in the same section as the requesting church
- Managers from other sections must not process the request
- Admins do not process account requests in this ruleset
- Department does not restrict account request handling in this ruleset
- New account requests notify same-section managers and optional `Super Admin`
- Each church may have up to two active or pending registrant accounts

---

## 8. Onsite Registration Module

### Functions
- Select event
- Search and select pastor/church
- Add one or more registration line items
- Choose fee category per line item
- Enter quantity per fee category
- Record official receipt / reference
- Save as paid

### Structure
Onsite registration is quantity-based, not delegate-based.

Example:
- `Regular (Onsite) x 10`
- `One-day Pass x 3`

### Payment Status Rule
The data model may retain `Unpaid` and `Partial` for future use, but the MVP records onsite submissions as `Paid`.

### Posting Authority
- `Registration Staff` may post onsite registrations only within explicitly assigned territorial and department scope
- `Admin` may post onsite registrations only for district-wide events in the same district and matching department scope
- `Manager` may post onsite registrations for churches in the assigned section when the event is available to that section and department scope matches
- `Manager` help on district-wide events is a registration workflow action only, not event ownership
- Onsite posting does not send notifications

---

## 9. Online Registration Module

### Functions
- Select open event
- Add one or more registration line items
- Choose fee category per line item
- Enter quantities
- Enter receipt / reference number
- Upload proof of payment
- Submit registration
- Track registration status

### Rules
- Registrant is limited to assigned pastor/church
- System validates event capacity before submission
- System reserves capacity immediately on successful submission
- Receipt / reference number is required
- Proof of payment is required
- Proof of payment files are stored on S3-compatible object storage instead of local server disk
- Access to uploaded receipts must remain authorization-controlled
- One receipt may cover multiple fee-category quantities

### Registration Statuses
- `Pending Verification`
- `Verified`
- `Rejected`
- `Needs Correction` if retained in the existing workflow

---

## 10. Verification and Review Module

### Review Responsibilities
- `Super Admin` can verify any online registration
- `Admin` can verify only district-wide events in the same district and matching department scope
- `Manager` can verify registrations for churches in the assigned section when the event is district-wide or sectional and department scope matches
- No-department reviewers only match no-department events
- Same department alone is not enough; action type and territorial scope must still match

### Review Actions
- Verify
- Reject
- Return for correction if the existing workflow keeps it
- Store reviewer notes and review history

### Notification Routing
- District event under a department -> matching district `Admin`, matching section `Manager`, optional `Super Admin`
- District event with no department -> no-department district `Admin`, no-department section `Manager`, optional `Super Admin`
- Sectional event under a department -> matching section `Manager`, optional `Super Admin`
- Sectional event with no department -> no-department section `Manager`, optional `Super Admin`

---

## 11. Notification Module

### Functions
- Store workflow notifications in the database
- Show unread notification count in the authenticated app header
- Show recent notifications in a header dropdown
- Mark one notification as read
- Mark all notifications as read
- Deliver notifications in real time to authenticated users

### Notification Triggers
- Church representative access request submitted
- Church representative access request approved
- Church representative access request rejected
- Online registration submitted for review
- Online registration resubmitted after correction
- Registration returned for correction
- Registration verified
- Registration rejected

### Delivery Rules
- Database notifications are the persisted source of truth
- Real-time delivery is used for authenticated users inside the app
- Public homepage event capacity refresh uses polling, not strict instant broadcasting
- External email or SMS delivery remains out of scope for the MVP

---

## 12. File Storage Module

### Functions
- Store uploaded online-registration receipts in an S3-compatible bucket
- Keep uploaded receipts outside the local application disk in production use
- Preserve original file name and upload timestamp metadata
- Support authorized viewing of uploaded receipts during verification

### Storage Rules
- Receipt files must use a configurable cloud disk
- Receipt files must remain private by default
- Verification and registration history screens must access receipts through authorized temporary access, not public bucket exposure
- Replaced receipts should delete the previous object after a successful update
- Failed or rolled-back uploads must not leave orphaned objects when cleanup is possible
- Production receipt storage must set `ONLINE_REGISTRATION_RECEIPTS_DISK=s3`, `AWS_DEFAULT_REGION`, and `AWS_BUCKET`
- Production deployments may use static credentials or an IAM role / equivalent provider identity
- `AWS_URL` and `AWS_ENDPOINT` stay empty for standard AWS S3 and are only populated for S3-compatible providers when required
- `AWS_USE_PATH_STYLE_ENDPOINT` remains `false` unless the provider requires path-style access

### Production Bucket Settings
- Keep the bucket private and block all public access
- Disable public website hosting on the receipt bucket
- Restrict application access to object read, write, and delete operations only
- Serve receipts through temporary authorized access instead of public bucket URLs
- Keep bucket and region configuration aligned with the deployed environment

---

## 13. Reports

### Required Reports
1. Event total registration
   - Filter by event
   - Filter by section
   - Filter by department when applicable
   - Show total quantity
   - Show counts per fee category
   - Show verification totals

2. No registration report
   - Filter by event
   - Show sections / pastors with no registration

### Recommended Additional Reports
- Remaining slots by event
- Registration summary by department
- Registration summary by section
- Registration summary by church

### Report Access Rules
- `Super Admin` can generate all reports across all scopes
- `Admin` can generate reports only for events inside the assigned district and matching department scope
- A no-department `Admin` can report only on no-department district events
- `Manager` can generate reports only for events inside the assigned section and matching department scope
- A no-department `Manager` can report only on no-department section events
- Report section filters must show only sections inside the signed-in user’s district, or the manager’s own section
- For district-wide events, a `Manager` may see only data from the manager's own section
- Managers must not see report data from other sections

### Authorization Precedence
Apply permission logic in this order:
1. `Super Admin` override
2. role authority for the action
3. territorial scope check
4. strict department match
5. section / church ownership where relevant
6. deny by default

---

## 14. Target Database Changes

### New / Updated Entities

#### `departments`
- `id`
- `name`
- `description`
- `status`

#### `users`
- `id`
- `name`
- `email`
- `password`
- `role_id`
- `district_id` nullable
- `section_id` nullable
- `department_id` nullable
- `pastor_id` nullable
- `position_title` nullable
- `status`

#### `events`
- `id`
- `name`
- `description`
- `date_from`
- `date_to`
- `venue`
- `registration_open_at`
- `registration_close_at`
- `total_capacity`
- `status`
- `scope_type`
- `district_id` nullable for migration/backfill, required for managed events going forward
- `section_id` nullable
- `department_id` nullable

Existing registration and fee-category tables remain, but must respect event scope and department ownership during authorization and reporting.

#### `registrations`
- Existing receipt path metadata remains valid
- `receipt_file_path` stores the object key/path on the configured disk
- `receipt_original_name` stores the original uploaded file name
- `receipt_uploaded_at` stores upload timestamp metadata

#### `notifications`
- Standard Laravel database notifications table
- Used for in-app workflow notifications and unread counts

---

## 15. MVP Validation Rules
- Prevent section creation without district
- Prevent pastor creation without section
- Prevent event creation without a valid scope configuration
- Require `district_id` for district-wide events
- Require `section_id` for sectional events
- Require sectional events to store the matching district from the selected section
- Allow `department_id` to be null for general events and general privileged accounts
- Enforce strict department matching; no-department is not a wildcard
- Prevent registrant access requests above the two-account church limit
- Prevent online registration outside assigned pastor/church
- Prevent registration when event is full or closed
- Prevent registration updates from exceeding available reserved capacity
- Validate receipt upload type and size
- Require valid cloud storage configuration before enabling production receipt uploads
- Preserve historical records through archive behavior instead of hard deletion

---

## 16. Recommended MVP Screens
1. Login
2. Dashboard
3. Event List / Event Form
4. Event Fee Category Setup
5. User List / User Form
6. District List / Form
7. Section List / Form
8. Department List / Form
9. Pastor / Church List / Form
10. Church Access Request Page
11. Onsite Registration Page
12. Online Registration Page
13. Registration Review / Verification Page
14. Reports Page
15. Header notification dropdown in authenticated layouts

---

## 17. Finalized Direction Before Implementation

The implementation should follow this model:
- role decides permission
- territorial scope decides reach
- department scope must match strictly
- `null department` means no-department only, not wildcard access
- action type must be evaluated separately
- title is metadata only
- registrants remain church-based
- same department does not automatically grant authority
- database notifications persist workflow history
- authenticated users receive realtime in-app notifications
- homepage capacity refresh uses polling against reservation-aware event metrics
- receipt uploads are stored on S3-compatible object storage with private access

This is the agreed target state for the next major update before application code changes begin.
