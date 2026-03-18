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
- `department_id = null` means the account or event is general / non-departmental.
- General accounts can operate across departments within their geographic scope.
- Department-scoped accounts are limited to their assigned department within their geographic scope.

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

---

### 4.2 Admin
#### Description
District-scoped reviewer and operator.

#### Scope Rules
- Always district-scoped
- May be department-scoped
- May be general / non-departmental

#### Permissions
- Manage users
- Manage districts, sections, departments, and pastors/churches
- Manage events and fee categories
- Approve church access requests
- Review and verify registrations
- View reports for accessible scope

#### Access Rules
- A general admin can access all district events, whether departmental or non-departmental
- A department-scoped admin can access only events in the assigned department within the district

---

### 4.3 Manager
#### Description
Section-scoped reviewer and operator.

#### Scope Rules
- Always section-scoped
- May be department-scoped
- May be general / non-departmental

#### Permissions
- Approve church access requests
- Review and verify registrations
- View reports for accessible scope
- Perform allowed registration operations within assigned scope

#### Access Rules
- A general manager can access all events within the assigned section, whether departmental or non-departmental
- A department-scoped manager can access only events in the assigned department within the assigned section

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
Registration staff remains operationally focused and department-neutral in this phase unless expanded later.

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
- District events are visible to district-scoped reviewers according to department rules
- Sectional events are visible to section-scoped reviewers according to department rules
- General events require general reviewers at the matching geographic scope

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
- Scope type (`district` or `section`)
- Assigned section (required for sectional events, otherwise null)
- Assigned department (optional)

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
- Set event scope and department ownership
- Open and close registration

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
- One receipt can cover multiple fee-category quantities in one submission

---

### 6.9 Notifications
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

### 6.10 Reports
#### Required Reports
- Event total registration
- No registration report

#### Recommended Additional Reports
- Remaining slots by event
- Registration summary by department
- Registration summary by section
- Registration summary by pastor/church
- Payment summary based on submitted references and receipts

---

## 7. Key Business Rules

### 7.1 Church Access Request Approval
Church representative access requests may be approved by:
- Super Admin
- Admin
- Manager

This approval rule is geographic-scope based, not department-restricted. Both department-scoped and general admin/manager accounts may approve requests within their allowed geographic scope.

### 7.2 Registration Verification Ownership
- A general district event must be verified by a general district reviewer or Super Admin
- A general sectional event must be verified by a general section reviewer or Super Admin
- A departmental district event may be verified by:
  - a department-scoped district reviewer for that department
  - a general district reviewer
  - Super Admin
- A departmental sectional event may be verified by:
  - a department-scoped section reviewer for that department
  - a general section reviewer
  - Super Admin

### 7.3 General Event Coverage
If general non-departmental events exist at a scope, at least one general reviewer account must exist at that scope.

### 7.4 Historical Data
- Archive operations must preserve historical registrations and review history
- Archived users, events, departments, sections, pastors, and fee categories must remain available for historical reporting and future audit trail features

---

## 8. Core Workflows

### 8.1 Event Setup Workflow
1. Super Admin or Admin sets up districts, sections, departments, and pastors/churches
2. Admin creates event
3. Admin assigns event scope and optional department
4. Admin sets fee categories and capacity
5. Admin creates user accounts with role, geographic scope, optional department, and optional title
6. Registration opens

### 8.2 Church Access Workflow
1. Church representative requests access for an assigned pastor/church
2. Super Admin, Admin, or Manager reviews the request
3. Reviewers receive in-app notifications for new requests
4. Approved account can sign in and submit registrations
5. Registrant receives approval or rejection notification

### 8.3 Online Registration Workflow
1. Registrant logs in
2. Selects an open event
3. Adds one or more fee-category line items
4. Enters receipt/reference number
5. Uploads proof of payment
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
- `events.section_id` nullable
- `events.department_id` nullable

---

## 10. Product Direction

The product should be implemented around this model:
- role controls permissions
- geographic scope controls reach
- optional department controls the organizational lane
- `null department` means general authority within the assigned scope
- position/title is metadata, not authorization
- registrant accounts stay church-based

This keeps the system operationally clear while supporting both departmental and general district events.
