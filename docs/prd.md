# PRD: Church Event Registration Application

## 1. Product Overview

### Product Name
Church Event Registration Application

### Objective
Build a centralized church event registration system for district use. The application must support onsite registration and church-based online registration without online payment processing. Online registrants submit a receipt or proof of payment instead.

### Primary Goal
Provide one operational platform for district, sectional, and department-owned events while preserving clear access control, registration verification, and historical data.

### Deployment Assumption
The system is operated per district deployment, but the product structure should be reusable by other districts in the organization.

---

## 2. Scope

### In Scope
- Event management
- Event fee configuration
- District management
- Section management
- Department management
- Pastor/church management
- User management
- Church representative access requests
- Onsite registration
- Online registration
- Receipt upload for online registration
- S3-backed receipt storage
- Registration verification
- In-app workflow notifications
- Capacity tracking and reservation
- Registration reports
- Historical archiving through soft deletes

### Out of Scope
- Online payment gateway integration
- Delegate-level personal details
- QR code check-in
- Badge printing
- SMS or email notifications
- Public self-registration without login

---

## 3. Operating Model

### 3.1 Geographic Scope
The system uses three scope levels:
- District scope
- Section scope
- Church/pastor scope

### 3.2 Department Scope
Privileged accounts and events may optionally belong to a department.

Supported departments for the current district are:
- Youth Ministries
- Ladies Ministries
- Apostolic Men's
- Sunday School
- Home Missions
- Music Commission
- Information Technology Commission

### 3.3 General vs Departmental Access
Permissions must always be evaluated by combining:
- role
- territorial scope
- department scope
- action type

Department matching is strict:
- If a user belongs to a department, they only match records and events in that same department
- If a user has no department, they only match records and events with no department
- No-department is not a wildcard
- Same department alone does not grant authority

### 3.4 Positions and Titles
District and sectional positions such as `President`, `Director`, `Presbyter`, and `Secretary` are organizational titles, not permission roles.

Titles should be stored as account metadata and must not replace the role model.

---

## 4. Users and Roles

### 4.1 Super Admin
#### Description
Deployment-wide system owner for IT or platform administration.

#### Permissions
- Full access to all modules
- Manage every district, section, department, church, event, and user
- Approve church access requests
- Verify any registration
- Override scope restrictions when needed
- Generate all reports

#### Scope Rules
- Must not be assigned to any district, section, department, or pastor
- No position/title is required

---

### 4.2 Admin
#### Description
District-scoped reviewer and operator.

#### Scope Rules
- Must belong to one district
- May belong to exactly one department or no department
- Must not be assigned to a pastor
- Must not be treated as section-scoped

#### Permissions
- Manage users
- Manage districts, sections, departments, and pastors/churches
- Manage district-wide events and fee categories inside matching district and department scope
- Post onsite registrations for district-wide events inside matching district and department scope
- Verify online registrations for district-wide events inside matching district and department scope
- View reports for accessible district and department scope

#### Access Rules
- A no-department admin matches only no-department district events
- A department-scoped admin matches only district events in the same department
- Admins do not manage sectional events
- Admins do not process account requests in this ruleset

---

### 4.3 Manager
#### Description
Section-scoped reviewer and operator.

#### Scope Rules
- Must belong to one section
- May belong to exactly one department or no department
- Must not be assigned to a pastor

#### Permissions
- Process account requests for churches in the same section
- Manage sectional events and fee categories inside matching section and department scope
- Post onsite registrations for churches in the same section when the event and department scope match
- Verify online registrations for churches in the same section when the event and department scope match
- View reports for accessible section and department scope

#### Access Rules
- A no-department manager matches only no-department section events
- A department-scoped manager matches only section events in the same department
- Managers may help process district-wide registrations for their own section, but that does not make them managers of the district-wide event record

---

### 4.4 Registration Staff
#### Description
Operational user for onsite event registration.

#### Permissions
- Create onsite registrations
- Search churches/pastors
- View event availability
- Save onsite transactions

#### Current Rule
Registration staff is operational only.

#### Scope Rules
- Scope depends on assigned district, optional section, and optional department
- Must not be assigned to a pastor
- No position/title is required
- Cannot manage event records
- Can post registrations only inside explicitly assigned scope

---

### 4.5 Registrant
#### Description
Church representative account used for online registration.

#### Permissions
- Log in
- Submit online registrations for assigned church/pastor
- Upload proof of payment
- View own registration history and status

#### Business Rules
- Registrants remain church-based, not department-based
- Each church may have up to two registrant accounts
- Registrants can register only under their assigned pastor/church record

---

## 5. Event Model

### Supported Event Ownership
An event may be:
- District event under a department
- Sectional event under a department
- District event with no department
- Sectional event with no department

### Event Scope Rules
Managing an event is separate from viewing an event or helping with registration.

- District event under a department:
  - managed by `Super Admin` or an `Admin` in the same district and same department
- District event with no department:
  - managed by `Super Admin` or a no-department `Admin` in the same district
- Sectional event under a department:
  - managed by `Super Admin` or a `Manager` in the same section and same department
- Sectional event with no department:
  - managed by `Super Admin` or a no-department `Manager` in the same section
- Managers may view district-wide events for workflow purposes when separate registration rules allow it, but they do not manage the event record
- Admins may view sectional events for workflow purposes when separate registration rules allow it, but they do not manage the event record
- Registration Staff and Registrants cannot manage events

### Event Fields
- Event name
- Description
- Venue
- Date from
- Date to
- Registration opening date
- Registration closing date
- Status
- Total capacity
- Remaining slots (computed)
- Owning district
- Scope type (`district` or `section`)
- Assigned section (required for sectional events, otherwise null)
- Assigned department (optional)

### Event Ownership Storage Rules
- Every event stores `district_id`
- District-wide events must store the owning `district_id` and keep `section_id` null
- Sectional events must store both `section_id` and the matching `district_id` from that section
- Event management, reporting, verification, and onsite posting must use the stored event district instead of inferring district ownership from related registrations
- Non-superadmin event forms must prefill and lock actor-owned scope fields:
  - `Admin` defaults to district-wide scope, assigned district, and assigned department or no-department lane
  - `Manager` defaults to sectional scope, assigned district, assigned section, and assigned department or no-department lane

### Fee Categories
Each event can have multiple fee categories such as:
- Regular (Online)
- Regular (Onsite)
- One-day Pass

### Fee Category Fields
- Category name
- Amount
- Slot limit (optional)
- Active status

### Event Business Rules
- Registration closes automatically when capacity is reached
- Registration closes when the closing date is reached
- Closed or cancelled events cannot accept new registrations
- `Pending Verification`, `Needs Correction`, and verified registrations reserve capacity
- `Rejected` and cancelled registrations release capacity
- Onsite registrations consume capacity immediately when saved
- Remaining slots must refresh without a full page reload
- Authenticated users receive real-time workflow notifications; public homepage availability may refresh through polling
- Archived events and fee categories remain available for historical lookups and audit reporting

---

## 6. Core Modules

### 6.1 Department Management
#### Description
Manage departments that own or organize district and sectional events.

#### Functional Requirements
- Create departments
- Edit departments
- Archive departments

#### Department Fields
- Department name
- Description (optional)
- Status

---

### 6.2 User Management
#### Description
Manage privileged accounts, registrant accounts, and scope assignments.

#### Functional Requirements
- Create users
- Edit users
- Deactivate users
- Archive users
- Assign roles
- Assign district, section, and department scope when applicable
- Assign pastor/church scope for registrants
- Store organizational position/title when needed

#### User Fields
- Full name
- Email
- Password
- Role
- District (optional by role)
- Section (optional by role)
- Department (optional by role)
- Pastor/church assignment (registrant only)
- Position/title (optional metadata)
- Status

---

### 6.3 District Management
#### Functional Requirements
- Create districts
- Edit districts
- Archive districts

---

### 6.4 Section Management
#### Functional Requirements
- Create sections
- Edit sections
- Archive sections

#### Business Rules
- A section must belong to a district
- Archive operations must preserve historical registrations, scoped users, and master data references

---

### 6.5 Pastor / Church Management
#### Functional Requirements
- Create pastor/church records
- Edit pastor/church records
- Archive pastor/church records

#### Pastor / Church Fields
- Parent section
- Pastor full name
- Church name
- Contact number
- Email (optional)
- Address (optional)
- Status

#### Business Rules
- A pastor/church must belong to a section
- The pastor/church record is the church access anchor for online registrants

---

### 6.6 Event Management
#### Functional Requirements
- Create events
- Edit events
- Archive events
- Configure fee categories
- Set total capacity
- Set event scope, owning district, and department ownership
- Open and close registration

#### Business Rules
- Every event must store an owning district
- District-wide events require `district_id` and must not store `section_id`
- Sectional events require `section_id` and must store the matching section district on `district_id`
- `Admin` can manage only district-wide events in the same district and matching department scope
- `Manager` can manage only sectional events in the same section and matching department scope
- Workflow visibility for registration help does not change event-record ownership

---

### 6.7 Onsite Registration
#### Description
Used by registration staff, managers, or admins for onsite transactions.

#### Functional Requirements
- Select event
- Search and select pastor/church
- Add multiple fee-category line items in one transaction
- Enter quantity per line item
- Save the transaction as paid
- Record official receipt or manual reference

#### Business Rules
- Onsite registration is quantity-based, not delegate-based
- Onsite transactions are recorded as `Paid` in the current MVP
- `Unpaid` and `Partial` remain reserved for future workflow expansion
- `Registration Staff` can post onsite registrations only inside explicitly assigned territorial and department scope
- `Admin` can post onsite registrations only for district-wide events in the same district and matching department scope
- `Manager` can post onsite registrations for churches inside the assigned section when the event is available to that section and department scope matches
- Manager help on district-wide events is a workflow action only, not event ownership
- Onsite posting does not send notifications

---

### 6.8 Online Registration
#### Description
Used by authorized church registrants assigned to a pastor/church.

#### Functional Requirements
- Select open event
- Add one or more registration line items
- Enter quantity per fee category
- Upload proof of payment
- Submit registration
- Track registration status

#### Business Rules
- Registrants can submit only under their assigned pastor/church
- System must validate capacity before submission
- System reserves event and fee-category capacity immediately after successful submission
- Receipt or reference number is required
- Proof of payment is required
- Proof of payment files must be stored in S3-compatible object storage for production use
- Uploaded receipt access must remain authorization-controlled
- One receipt can cover multiple fee-category quantities in one submission

---

### 6.9 File Storage
#### Description
Uploaded proof-of-payment files must be stored on S3-compatible object storage instead of relying on local application disk storage.

#### Functional Requirements
- Store online registration receipt uploads on a configurable cloud disk
- Keep stored receipt objects private by default
- Preserve original file name and upload timestamp metadata
- Support authorized viewing of receipts during verification and history review
- Delete replaced receipt objects after successful updates

#### Storage Rules
- Production deployments should use S3 or S3-compatible object storage
- Local development may still use local disk when cloud credentials are not configured
- Receipt delivery should use authorized temporary access or an application-controlled proxy route
- Bucket contents must not be exposed publicly by default
- Production receipt storage must have `ONLINE_REGISTRATION_RECEIPTS_DISK=s3`, `AWS_DEFAULT_REGION`, and `AWS_BUCKET` configured
- Production deployments may use static AWS credentials or an IAM role / equivalent provider identity
- `AWS_URL` and `AWS_ENDPOINT` should remain empty for standard AWS S3 and only be set for S3-compatible providers when required
- `AWS_USE_PATH_STYLE_ENDPOINT` should remain `false` unless the object-storage provider explicitly requires path-style access

#### Production Bucket Settings
- Keep the bucket private and block all public access
- Disable public website hosting for the receipt bucket
- Limit application access to object read, write, and delete operations only
- Use short-lived temporary URLs for authorized receipt access instead of public object URLs
- Keep region and bucket naming consistent with deployed environment configuration

---

### 6.10 Notifications
#### Description
In-app workflow notifications keep reviewers and registrants aware of approval and verification updates.

#### Functional Requirements
- Store notifications in the database
- Show unread notification count in the authenticated header
- Show recent notifications in a dropdown list
- Mark one notification as read
- Mark all notifications as read
- Deliver notifications in real time to authenticated users

#### Notification Triggers
- Church access request submitted
- Church access request approved
- Church access request rejected
- Online registration submitted for review
- Registration returned for correction
- Registration resubmitted after correction
- Registration verified
- Registration rejected

#### Delivery Rules
- Database notifications are the persisted source of truth
- Real-time delivery is for authenticated users inside the app
- The public homepage does not require strict instant updates; capacity may refresh through polling
- External email and SMS notifications remain out of scope in this phase

---

### 6.11 Reports
#### Required Reports
- Event total registration
- No registration report

#### Recommended Additional Reports
- Remaining slots by event
- Registration summary by department
- Registration summary by section
- Registration summary by pastor/church
- Payment summary based on submitted references and receipts

#### Report Access Rules
- `Super Admin` can generate all reports across all scopes
- `Admin` can generate reports only for events inside the assigned district and matching department scope
- A no-department `Admin` can report only on no-department district events
- `Manager` can generate reports only for events inside the assigned section and matching department scope
- A no-department `Manager` can report only on no-department section events
- Report section filters must show only sections inside the signed-in user’s district, or the manager’s own section
- For district-wide events, a `Manager` may see only data from the manager's own section
- Managers must not see data from other sections

---

## 7. Key Business Rules

### 7.1 Church Access Request Approval
Church representative access requests may be approved by:
- Super Admin
- Manager

This approval rule is section-scoped. Managers may process requests only when they belong to the same section as the requesting church. Department does not restrict account request handling in this ruleset, and Admins do not process account requests unless a later rule explicitly adds that authority.

New account requests notify:
- Managers in the same section as the requesting church
- Optional `Super Admin`

### 7.2 Registration Verification Ownership
- `Admin` can verify only district-wide events in the same district and matching department scope
- `Manager` can verify registrations for churches in the assigned section when the event is district-wide or sectional and department scope matches
- No-department reviewers match only no-department events
- `Super Admin` can verify any registration
- Event ownership does not automatically determine verification ownership; role, territorial scope, department scope, and action type must all match

### 7.3 General Event Coverage
If general non-departmental events exist at a scope, at least one no-department reviewer account must exist at that scope.

### 7.4 Verification Notifications
- District-wide event under a department -> matching district `Admin`, matching section `Manager`, optional `Super Admin`
- District-wide event with no department -> no-department district `Admin`, no-department section `Manager`, optional `Super Admin`
- Sectional event under a department -> matching section `Manager`, optional `Super Admin`
- Sectional event with no department -> no-department section `Manager`, optional `Super Admin`

### 7.5 Historical Data
- Archive operations must preserve historical registrations and review history
- Archived users, events, departments, sections, pastors, and fee categories must remain available for historical reporting and future audit trail features

### 7.6 Authorization Precedence
Apply permission logic in this order:
1. `Super Admin` override
2. role authority for the action
3. territorial scope check
4. strict department match
5. section / church ownership where relevant
6. deny by default

---

## 8. Core Workflows

### 8.1 Event Setup Workflow
1. Super Admin sets up or oversees districts, sections, departments, and pastors/churches
2. Admin creates district-wide events inside matching district and department scope
3. Manager creates sectional events inside matching section and department scope
4. Event owner assigns the owning district, scope, and optional department
5. Super Admin or Admin creates user accounts with role, territorial scope, optional department, and optional title
6. Registration opens

### 8.2 Church Access Workflow
1. Church representative requests access for an assigned pastor/church
2. Super Admin or a Manager in the same section reviews the request
3. Reviewers receive in-app notifications for new requests
4. Approved account can sign in and submit registrations
5. Registrant receives approval or rejection notification

### 8.3 Online Registration Workflow
1. Registrant logs in
2. Selects an open event
3. Adds one or more fee-category line items
4. Enters receipt/reference number
5. Uploads proof of payment to private cloud object storage
6. Submits registration and reserves capacity immediately
7. Assigned reviewers receive in-app notification for verification
8. Assigned reviewer verifies or returns the registration
9. Registrant receives the verification outcome notification

### 8.4 Onsite Registration Workflow
1. Staff selects event
2. Staff selects pastor/church
3. Staff adds one or more registration line items
4. Staff records the official receipt/reference
5. Staff saves the paid transaction and consumes capacity immediately

---

## 9. Data Model Summary

### Core Entities
- users
- roles
- districts
- sections
- departments
- pastors
- events
- event_fee_categories
- registrations
- registration_items
- notifications

### Target Data Additions for the Department Model
- `users.department_id` nullable
- `users.position_title` nullable
- `events.scope_type`
- `events.district_id` nullable for migration/backfill, required for managed events going forward
- `events.section_id` nullable
- `events.department_id` nullable

### Receipt Storage Notes
- Existing registration receipt metadata remains the source of truth
- `receipt_file_path` stores the object key on the configured storage disk
- The storage disk should be environment-driven so local and production deployments can differ safely

---

## 10. Product Direction

The product should be implemented around this model:
- role controls permissions
- territorial scope controls reach
- department scope must match strictly
- `null department` means no-department only, not wildcard authority
- action type must be evaluated separately
- position/title is metadata, not authorization
- registrant accounts stay church-based
- same department does not automatically grant authority
- uploaded receipt files should be stored on private S3-compatible object storage in production

This keeps the system operationally clear while supporting both departmental and general district events.
