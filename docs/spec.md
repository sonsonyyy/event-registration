# Church Event Registration Application - Specification

## Document Status
This document describes the currently implemented system as of May 1, 2026. It replaces older forward-looking notes and should be treated as the baseline for future changes.

---

## 1. System Summary

The current application supports:
- Public event discovery on the welcome page
- Self-service church representative access requests
- Scoped user management for `Admin`, `Manager`, `Registration Staff`, and `Online Registrant`
- System-wide `Super Admin` access
- District, section, department, and pastor/church master data
- District-wide and sectional event management
- Fee category setup per event
- Onsite grouped registrations
- Online grouped registrations with receipt upload
- Receipt verification with review history
- In-app workflow notifications with realtime broadcast delivery
- Reservation-aware event and fee-category capacity tracking
- District and section scoped reporting with Excel exports
- Soft-delete archiving for master data, users, events, and fee categories
- Dashboard, profile, password, and two-factor authentication settings

The product remains intentionally quantity-based. Registrations are stored as grouped line items, not delegate-by-delegate attendee records.

---

## 2. Scope and Access Model

### 2.1 Authorization Axes
Privileged access is determined by combining:
- role
- territorial scope
- department scope
- action type

Organizational titles such as `President`, `Director`, `Presbyter`, and `Secretary` are stored as metadata in `users.position_title`. They do not grant authority by themselves.

### 2.2 Territorial Scope
The application uses three operational scope levels:
- district
- section
- pastor/church

### 2.3 Department Scope
Department matching is strict for privileged event, registration, verification, and reporting workflows:
- If a privileged user belongs to a department, they only match records in that same department.
- If a privileged user has no department, they only match records where `department_id` is `null`.
- No-department is not a wildcard.

Current seed data creates these default departments:
- Youth Ministries
- Ladies Ministries
- Apostolic Men's
- Sunday School
- Home Missions
- Music Commission
- Information Technology Commission

These are seeded defaults, not a hard-coded limit. Departments are managed through CRUD screens.

### 2.4 Important Exception
Registrant account approval does not use department matching. Account requests are reviewed by territorial scope only:
- `Super Admin` can review all requests.
- `Admin` can review requests in the assigned district.
- `Manager` can review requests in the assigned section.

---

## 3. Roles

### 3.1 Super Admin
`Super Admin` is the global override role.

Current behavior:
- Can access all modules and routes
- Can manage all districts, sections, departments, pastors, events, registrations, users, and reports
- Can review any registrant account request
- Can review any online registration
- Receives the system admin navigation flag in the authenticated app shell

Notes:
- This role exists in the database and seeders.
- The standard user-management form does not expose `Super Admin` as a selectable role.

### 3.2 Admin
`Admin` is district-scoped.

Current behavior:
- Must belong to one district
- Cannot be assigned to a pastor
- Is treated as district-scoped, not section-scoped
- Can manage users inside the assigned district
- Can manage districts, sections, departments, and pastors through the admin workspace
- Can manage district-wide events in the assigned district when department scope matches
- Can post onsite registrations for district-wide events in the assigned district when department scope matches
- Can review online registrations for district-wide events in the assigned district when department scope matches
- Can review registrant account requests across the assigned district
- Can view district-scoped reports

### 3.3 Manager
`Manager` is section-scoped.

Current behavior:
- Must belong to one section
- Cannot be assigned to a pastor
- Can manage sectional events in the assigned section when department scope matches
- Can post onsite registrations for churches in the assigned section
- Can review online registrations for churches in the assigned section
- Can review both:
  - district-wide events in the manager's district for the manager's own section
  - sectional events in the manager's own section
- Can review registrant account requests inside the assigned section
- Can view reports, but only for section data within the manager's scope

### 3.4 Registration Staff
`Registration Staff` is an onsite operations role.

Current behavior:
- Must belong to a district
- May optionally belong to a section
- May optionally belong to a department
- Cannot be assigned to a pastor
- Can create onsite registrations
- Can update onsite registrations that they encoded themselves
- Can see accessible pastors and events for onsite work
- Cannot manage events
- Cannot access verification queues
- Cannot access reports
- Cannot access admin master-data pages

### 3.5 Online Registrant
`Online Registrant` is church-scoped.

Current behavior:
- Must be assigned to one pastor/church
- Is not department-scoped
- Can only work inside the assigned pastor/church record
- Can see district-wide events in the assigned district and sectional events in the assigned section
- Can view, edit, and cancel only the pastor's own online registrations

Approval behavior:
- Admin-created registrants default to `approval_status = approved` and `account_source = admin`
- Self-service registrants are created with `approval_status = pending` and `account_source = self_service`
- Pending or rejected self-service registrants can sign in, but online registration routes remain locked until approved

Church limit:
- Each pastor/church may have at most two active or pending online registrant accounts

---

## 4. Public and Authentication Experience

### 4.1 Welcome Page
The public welcome page currently provides:
- A reservation-aware list of open events
- Remaining event capacity
- Remaining fee-category capacity where a slot limit exists
- Registration flow guidance
- FAQ content

Event visibility rules on the public page:
- Event status must be `open`
- The registration window must currently be open
- The event must still have available capacity
- At least one active fee category must still have capacity

The page polls the `events` prop every 20 seconds so remaining slots stay current without a full page reload.

### 4.2 Self-Service Registrant Access
Guests can open the self-service access request form at the configured path:
- Default path: `church-representative-access`
- Config key: `registration.registrant_access_path`

The form currently requires:
- representative name
- email
- section
- pastor/church
- password

Submission behavior:
- creates an active `Online Registrant`
- derives district and section from the selected pastor
- marks the request as pending approval
- redirects to login
- notifies eligible reviewers

### 4.3 Authentication and Settings
The repository already includes:
- login
- registration
- email verification
- password reset
- password confirmation
- optional two-factor authentication
- profile update
- password update

Workflow notifications are in-app only. This is separate from Fortify's built-in authentication email flows.

---

## 5. Event Model

### 5.1 Event Ownership
The implemented event ownership model supports:
- district event with no department
- district event under a department
- sectional event with no department
- sectional event under a department

### 5.2 Ownership Rules
Current event-record ownership rules:
- `Super Admin` can manage all events
- `Admin` can manage only district-wide events in the same district and same department lane
- `Manager` can manage only sectional events in the same section and same department lane
- `Registration Staff` and `Online Registrant` cannot manage event records

Managers may still help process registrations for district-wide events in their section. That workflow access does not make them owners of the district event record.

### 5.3 Event Fields
Implemented event fields:
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
- `district_id`
- `section_id`
- `department_id`

Supported event statuses:
- `draft`
- `open`
- `closed`
- `completed`
- `cancelled`

Supported scope types:
- `district`
- `section`

### 5.4 Fee Categories
Each event can have multiple fee categories.

Implemented fee-category fields:
- `category_name`
- `amount`
- `slot_limit`
- `status`

Supported fee-category behavior:
- categories can be active or inactive
- create forms for registrations only expose active categories
- fee categories are soft-deleted with their parent event

### 5.5 Event Capacity
Capacity is tracked at two levels:
- event total capacity
- optional fee-category slot limits

The application calculates:
- reserved quantity
- remaining event slots
- remaining fee-category slots
- whether an event is effectively full

---

## 6. Registration Model

### 6.1 Registration Shape
Registrations are grouped transactions with child `registration_items`.

Implemented registration fields:
- `event_id`
- `pastor_id`
- `encoded_by_user_id`
- `registration_mode`
- `payment_status`
- `registration_status`
- `payment_reference`
- `receipt_file_path`
- `receipt_original_name`
- `receipt_uploaded_at`
- `receipt_uploaded_by_user_id`
- `remarks`
- `submitted_at`
- `verified_at`
- `verified_by_user_id`

Each line item stores:
- `fee_category_id`
- `quantity`
- `unit_amount`
- `subtotal_amount`
- `remarks`

### 6.2 Registration Modes
Supported modes:
- `onsite`
- `online`

### 6.3 Payment Statuses
Supported payment status values exist in the model:
- `paid`
- `unpaid`
- `partial`

Current workflow behavior:
- onsite submissions are stored as `paid`
- online submissions are also stored as `paid`
- receipt review is tracked through `registration_status`, not through a separate unpaid workflow

### 6.4 Registration Statuses
Supported statuses:
- `draft`
- `submitted`
- `pending verification`
- `needs correction`
- `verified`
- `completed`
- `rejected`
- `cancelled`

Current usage:
- online create and resubmit flows store `pending verification`
- online correction flow uses `needs correction`
- verified online registrations become `verified`
- rejected online registrations become `rejected`
- cancelled online registrations become `cancelled`
- onsite registrations are stored as `completed`

### 6.5 Capacity Reservation Rules
These statuses currently reserve capacity:
- `submitted`
- `pending verification`
- `needs correction`
- `verified`
- `completed`

These statuses do not reserve capacity:
- `draft`
- `rejected`
- `cancelled`

---

## 7. Implemented Modules

### 7.1 Master Data and Users
Implemented CRUD and archive screens exist for:
- departments
- districts
- sections
- pastors/churches
- users

Current behavior:
- Admin workspace uses Inertia list/create/edit pages
- Admin list pages support search and pagination
- Pastors, districts, sections, departments, events, fee categories, and users are archived with soft deletes
- Admin users are limited to their own district when managing users

User-management notes:
- The standard form supports `Admin`, `Manager`, `Registration Staff`, and `Online Registrant`
- Selecting a pastor automatically resolves the matching section and district
- Managers must have a section
- Registration staff must have a district
- Online registrants must have a pastor

### 7.2 Onsite Registration
Implemented onsite features:
- create grouped onsite registrations
- edit existing onsite registrations when authorized
- search and paginate onsite registration history
- choose a pastor/church
- choose one or more fee categories
- store payment reference and remarks

Current behavior:
- stored as `registration_mode = onsite`
- stored as `payment_status = paid`
- stored as `registration_status = completed`
- creates no workflow notification

Scope rules:
- `Admin` may post only for district-wide events in the assigned district and matching department lane
- `Manager` may post only for churches in the assigned section and matching event access lane
- `Registration Staff` may post within the assigned district, optional section, and department lane

### 7.3 Online Registration
Implemented online features:
- list own registrations
- create a registration with receipt upload
- edit a registration while still correctable
- cancel a registration before verification closes the workflow
- view uploaded receipts
- view latest review and full review history

Current behavior:
- accessible only to approved registrants
- requires `payment_reference`
- requires a receipt file
- supports multiple fee-category line items in one submission
- reserves capacity immediately on submission
- resubmissions trigger a reviewer notification
- cancellations release capacity

### 7.4 Verification and Review
Implemented verification features:
- verification queue
- receipt viewing
- review decision capture
- review history per registration
- summary counts by status

Available review decisions:
- `verified`
- `needs correction`
- `rejected`

Current behavior:
- only online registrations enter the verification queue
- queue history includes reviewer, decision, reason, notes, and timestamp
- section filtering is available to admins and super admins
- managers do not get a multi-section filter; their queue is already section-scoped

### 7.5 Notifications
Implemented notification features:
- database persistence
- broadcast delivery
- unread count in shared props
- recent notification list in the app shell
- mark one as read
- mark all as read

Current workflow notification types:
- registrant access requested
- registrant access approved
- registrant access rejected
- registration submitted for review
- registration returned for correction
- registration resubmitted
- registration verified
- registration rejected

Routing rules:
- account request notifications go to active super admins, same-district admins, and same-section managers
- registration review notifications go to active reviewers whose event, territory, and department scope matches

### 7.6 Reports
Implemented report outputs:
- event total registration summary
- fee-category totals
- section summary
- churches with registration
- churches without registration
- Excel export for churches with registration
- Excel export for churches without registration

Access rules:
- `Super Admin` can report across all scopes
- `Admin` can report on accessible district events in the assigned department lane
- `Manager` can report only within the assigned section
- `Registration Staff` cannot access reports
- `Online Registrant` cannot access reports

Important behavior:
- managers only see their own section data even when the selected event is district-wide
- report event options include archived events for historical lookup

### 7.7 Dashboard
The dashboard is role-aware and currently includes:
- quick actions
- scoped metrics
- open events
- recent registrations
- workflow notification data
- registrant approval notice for pending or rejected self-service accounts

### 7.8 Settings and Security
Authenticated users currently have:
- profile settings
- password settings
- optional two-factor authentication setup and recovery codes

---

## 8. Receipt Storage and Delivery

### 8.1 Configured Storage
Receipt storage is configurable through `config/registration.php`.

Relevant settings:
- `ONLINE_REGISTRATION_RECEIPTS_DISK`
- `ONLINE_REGISTRATION_RECEIPT_MAX_KB`
- `ONLINE_REGISTRATION_RECEIPT_DIRECTORY`
- `ONLINE_REGISTRATION_RECEIPT_URL_TTL_MINUTES`

Current default behavior:
- non-production environments default to `local`
- production defaults to `s3`

### 8.2 Delivery Rules
Current receipt delivery behavior:
- local receipts are served through the application
- S3 receipts are delivered through temporary URLs
- receipts remain authorization-controlled
- missing files return `404`

### 8.3 S3 Requirements
When `ONLINE_REGISTRATION_RECEIPTS_DISK=s3`, the application expects:
- S3 bucket
- S3 region

Tests explicitly verify that S3 receipt storage fails fast when required bucket or region configuration is missing.

---

## 9. Data Retention and Archiving

Soft deletes are currently enabled for:
- users
- departments
- districts
- sections
- pastors
- events
- event fee categories

Registrations and registration reviews are not soft-deleted. Historical continuity is preserved by:
- keeping registration and review records intact
- loading soft-deleted related records where historical lookups are needed
- keeping archived events and fee categories available in reporting contexts

---

## 10. Current Schema Summary

Core tables in the current system:
- `roles`
- `users`
- `districts`
- `sections`
- `departments`
- `pastors`
- `events`
- `event_fee_categories`
- `registrations`
- `registration_items`
- `registration_reviews`
- `notifications`

Relationship summary:
- district has many sections
- section belongs to district and has many pastors
- pastor belongs to section
- user belongs to role and may belong to district, section, department, and pastor
- event belongs to district and may belong to section and department
- event has many fee categories
- registration belongs to event and pastor
- registration has many items and many reviews
- registration review belongs to registration and reviewer user

---

## 11. Seeded Baseline

The default database seed currently provides:
- default roles
- default departments
- demo district/section/pastor hierarchy
- a sample district event: `CLD Youth Conference 2026`
- seeded super admin, admin, and manager accounts

The seeded sample event is district-scoped, assigned to `Youth Ministries`, and includes:
- `Regular (Online)` as active
- `One-day Pass` as inactive
- `Regular (Onsite)` as inactive

---

## 12. Out of Scope

The current system does not implement:
- online payment gateway integration
- per-delegate attendee records
- QR code check-in
- badge printing
- SMS workflow notifications
- email workflow notifications beyond standard authentication flows
- public event registration without login

The current product baseline is therefore:
- manual payment reference plus receipt upload
- grouped registrations instead of attendee rosters
- scoped in-app operations for admins, managers, staff, and registrants
- historical reporting over archived master data
