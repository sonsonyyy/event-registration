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
- In-app workflow notifications
- Capacity tracking, reservation, and registration limits
- Reports by event, section, and department
- Historical archiving through soft deletes

---

## 2. Access Model

### 2.1 Authorization Axes
The MVP uses four separate concepts:
- `role` for permissions
- `geographic scope` for reach
- `department` for organizational lane
- `position/title` for metadata only

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

`department_id = null` means the account or event is general / non-departmental.

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

---

### Admin
District-scoped reviewer and operator.

**Scope**
- District
- Optional department

**Permissions**
- Manage users
- Manage districts, sections, departments, pastors/churches
- Manage events and fee categories
- Approve church access requests
- Verify registrations
- View district-level reports

**Rules**
- General admin (`department_id = null`) can access all district events across departments
- Department admin can access only district activity for the assigned department

---

### Manager
Section-scoped reviewer and operator.

**Scope**
- Section
- Optional department

**Permissions**
- Approve church access requests
- Verify registrations
- View section-level reports
- Perform allowed registration operations within assigned scope

**Rules**
- General manager (`department_id = null`) can access all section events across departments
- Department manager can access only section activity for the assigned department

---

### Registration Staff
Operational onsite encoder.

**Permissions**
- Create onsite registrations
- Search pastors/churches
- View event availability

**MVP Rule**
Registration staff remains department-neutral in this phase unless expanded later.

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
- General district events are handled by general district reviewers
- General sectional events are handled by general section reviewers
- Departmental district events are handled by same-department district reviewers or general district reviewers
- Departmental sectional events are handled by same-department section reviewers or general section reviewers
- Super Admin can handle all events

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
- Scope type (`district`, `section`)
- Section assignment (nullable, required for sectional events)
- Department assignment (nullable)

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
- `Super Admin`: unrestricted
- `Admin`: district-scoped, optional department
- `Manager`: section-scoped, optional department
- `Registration Staff`: operational only
- `Registrant`: pastor/church scoped only

### Important Rule
Church access approval is scope-based, not department-restricted. Department-scoped and general admins/managers may approve access requests within their allowed geographic scope.

---

## 7. Church Access Request Module

### Functions
- Request church representative access
- Assign request to a pastor/church
- Approve request
- Reject request

### Approval Authority
- Super Admin
- Admin
- Manager

### Business Rules
- Access requests are approved at the geographic scope level
- Registrant accounts remain church-based even when approvers are department-scoped
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
- One receipt may cover multiple fee-category quantities

### Registration Statuses
- `Pending Verification`
- `Verified`
- `Rejected`
- `Needs Correction` if retained in the existing workflow

---

## 10. Verification and Review Module

### Review Responsibilities
- General district events -> general district reviewer
- General sectional events -> general section reviewer
- Departmental district events -> matching department district reviewer or general district reviewer
- Departmental sectional events -> matching department section reviewer or general section reviewer
- Super Admin -> unrestricted override

### Review Actions
- Verify
- Reject
- Return for correction if the existing workflow keeps it
- Store reviewer notes and review history

### Critical Staffing Rule
If general non-departmental events exist at a scope, a non-departmental reviewer account must exist at that scope.

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

## 12. Reports

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

---

## 13. Target Database Changes

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
- `section_id` nullable
- `department_id` nullable

Existing registration and fee-category tables remain, but must respect event scope and department ownership during authorization and reporting.

#### `notifications`
- Standard Laravel database notifications table
- Used for in-app workflow notifications and unread counts

---

## 14. MVP Validation Rules
- Prevent section creation without district
- Prevent pastor creation without section
- Prevent event creation without a valid scope configuration
- Require `section_id` for sectional events
- Allow `department_id` to be null for general events and general privileged accounts
- Prevent registrant access requests above the two-account church limit
- Prevent online registration outside assigned pastor/church
- Prevent registration when event is full or closed
- Prevent registration updates from exceeding available reserved capacity
- Validate receipt upload type and size
- Preserve historical records through archive behavior instead of hard deletion

---

## 15. Recommended MVP Screens
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

## 16. Finalized Direction Before Implementation

The implementation should follow this model:
- role decides permission
- geographic scope decides reach
- department decides the lane
- `null department` means general authority within that scope
- title is metadata only
- registrants remain church-based
- general events require general reviewers
- database notifications persist workflow history
- authenticated users receive realtime in-app notifications
- homepage capacity refresh uses polling against reservation-aware event metrics

This is the agreed target state for the next major update before application code changes begin.
