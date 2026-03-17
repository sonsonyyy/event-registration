# PRD: Church Event Registration Application

## 1. Product Overview

### Product Name
Church Event Registration Application

### Objective
Build a simple district-level event registration application for church use. The system must support both onsite registration and online church-based registration without online payment processing. Instead of online payment, online registrants will upload a receipt or proof of payment.

### Primary Goal
Provide a centralized system for managing church event registrations across one district with multiple sections and pastors/churches, while tracking capacity, registration quantities, and payment proof submissions.

---

## 2. Scope

### In Scope
- Event management
- Event fee configuration
- District management
- Section management
- Pastor/church management
- User management
- Onsite registration
- Online registration
- Receipt upload for online registration
- Capacity tracking
- Registration reports

### Out of Scope
- Online payment gateway integration
- Delegate-level personal details
- QR code check-in
- Badge printing
- SMS or email notifications
- Public self-registration without login

---

## 3. Users and Roles

## 3.1 Admin
### Description
Full-access user for the entire application.

### Permissions
- Create, edit, archive events
- Manage event fee categories
- Manage users
- Manage districts
- Manage sections
- Manage pastors/churches
- Manage registrations
- Review and verify uploaded receipts
- View all reports

---

## 3.2 Manager
### Description
Operational user with section-based access.

### Permissions
- Manage registrations
- View reports
- Access only data within assigned section

### Restrictions
- Cannot manage events
- Cannot manage pastors
- Cannot manage sections

---

## 3.3 Registration Staff
### Description
User for onsite event registration.

### Permissions
- Create onsite registrations
- Search churches/pastors
- View event availability
- Print or view registration confirmation

### Restrictions
- No event management
- No master data management

---

## 3.4 Online Registrant
### Description
User assigned to one pastor/church for online registration.

### Permissions
- Log in
- Register for open events under assigned pastor/church
- Upload proof of payment
- View own registration history and status

### Restrictions
- Can only register for assigned pastor record
- Cannot register for other pastors/churches

---

## 4. Business Context and Data Structure

### Organizational Structure
- One district
- Multiple sections under the district
- Multiple pastors/churches under each section

### Registration Model
The system does **not** store individual delegate details.

Instead:
- One registration is one transaction
- One transaction can contain multiple fee-category line items
- Each line item contains:
  - fee category
  - quantity
  - amount

### Example
One registration transaction may contain:
- Regular (Onsite) × 10
- One-day Pass × 3

---

## 5. Core Features

## 5.1 Event Management

### Description
Admin manages events and their registration settings.

### Functional Requirements
- Admin can create an event
- Admin can edit an event
- Admin can archive an event
- Admin can configure multiple fee categories per event
- Admin can set event capacity
- Admin can open and close registration

### Event Fields
- Event name
- Description
- Date from
- Date to
- Venue
- Registration opening date
- Registration closing date
- Status
- Total capacity
- Remaining slots (computed)

### Event Status Values
- Draft
- Open
- Closed
- Completed
- Cancelled

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

### Business Rules
- Registration must close automatically when capacity is reached
- Registration must close when the closing date is reached
- Closed or cancelled events cannot accept new registrations
- Remaining slots must be shown in real time
- Archived events and fee categories must remain available for historical registration lookups and future audit reporting

---

## 5.2 User Management

### Description
Admin manages system users and access scope.

### Functional Requirements
- Admin can create users
- Admin can edit users
- Admin can deactivate users
- Admin can archive users
- Admin can assign roles
- Admin can assign district, section, or pastor scope when needed

### User Fields
- Full name
- Username or email
- Password
- Role
- Assigned district (optional)
- Assigned section (optional)
- Assigned pastor (optional)
- Status

### Status Values
- Active
- Inactive

---

## 5.3 District Management

### Description
Admin manages district records.

### Functional Requirements
- Admin can create districts
- Admin can edit districts
- Admin can archive districts

### District Fields
- District name
- Description (optional)
- Status

---

## 5.4 Section Management

### Description
Admin manages sections under a district.

### Functional Requirements
- Admin can create sections
- Admin can edit sections
- Admin can archive sections

### Section Fields
- Parent district
- Section name
- Description (optional)
- Status

### Business Rules
- A section must belong to a district
- Archive operations must preserve historical registrations, scoped users, and related master data references instead of hard-deleting them

---

## 5.5 Pastor Management

### Description
Admin manages pastors/churches under a section.

### Functional Requirements
- Admin can create pastors
- Admin can edit pastors
- Admin can archive pastors

### Pastor Fields
- Parent section
- Pastor full name
- Church name
- Contact number
- Email (optional)
- Address (optional)
- Status

### Business Rules
- A pastor must belong to a section
- The pastor record represents the church/account owner for online registration purposes

---

## 5.6 Onsite Registration

### Description
Used by registration staff, manager, or admin for onsite registrations.

### Functional Requirements
- User can select an event
- User can search and select a pastor/church
- User can create one transaction with multiple registration line items
- User can choose fee category per line item
- User can enter quantity per line item
- User can add multiple fee categories within one transaction
- User saves the transaction as paid
- User must record official receipt or manual reference
- User can save and print/view registration confirmation

### Registration Structure
Onsite registration is quantity-based, not delegate-based.

### Example
- Regular (Onsite) × 10
- One-day Pass × 3

### Payment Status Values
- Paid
- Unpaid
- Partial

The current MVP records both onsite and online submissions as `Paid`. `Unpaid` and `Partial` remain reserved for future workflow enhancements.

---

## 5.7 Online Registration

### Description
Used by online registrants assigned to a specific pastor/church.

### Functional Requirements
- User can select an open event
- User can add one or more registration line items
- User can select fee category per group of delegates
- User can enter quantity per fee category
- User can upload proof of payment
- User can submit registration
- User can view registration status

### Business Rules
- Online registrant can only register under assigned pastor/church
- System must validate capacity before submission
- Receipt or reference number is required before final submission
- Proof of payment is required before final submission
- One receipt can cover multiple fee-category quantities in one registration

### Registration Status Values
- Pending Verification
- Verified
- Rejected

### Receipt Upload Rules
- Allowed file types: JPG, PNG, PDF
- Max file size must be configurable
- System must store upload time
- System must store uploader
- Admin/manager must be able to review uploaded receipt

---

## 5.8 Reports

### Description
The system provides operational registration reports.

### Required Reports

#### 1. Event Total Registration
Filters:
- Event
- Section

Output:
- Total registered quantity
- Count per fee category
- Verified vs pending totals if receipt verification is used

#### 2. No Registration Report
Filters:
- Event

Output:
- Sections with no registration
- Pastors with no registration

### Recommended Additional Reports
- Remaining slots by event
- Registration summary by district
- Registration summary by pastor/church
- Payment summary based on receipt submissions or marked payments

---

## 6. Core Workflows

## 6.1 Event Setup Workflow
1. Admin creates district
2. Admin creates sections
3. Admin creates pastors/churches
4. Admin creates event
5. Admin sets fee categories
6. Admin sets capacity
7. Admin creates users
8. Admin assigns roles and scope
9. Admin opens registration

---

## 6.2 Online Registration Workflow
1. Online registrant logs in
2. User selects event
3. User adds one or more registration line items under assigned pastor/church
4. User uploads proof of payment
5. User submits registration
6. Admin or manager reviews receipt if verification is enabled
7. Registration status is updated

---

## 6.3 Onsite Registration Workflow
1. Staff selects event
2. Staff searches or selects pastor/church
3. Staff adds one or more registration line items
4. Staff selects fee category for each line
5. Staff enters quantity for each line
6. Staff records payment status
7. Staff saves registration

---

## 7. Data Model

## 7.1 Entities

### users
- id
- name
- email_or_username
- password
- role_id
- district_id (nullable)
- section_id (nullable)
- pastor_id (nullable)
- status
- created_at
- updated_at

### roles
- id
- name

### districts
- id
- name
- description
- status
- created_at
- updated_at

### sections
- id
- district_id
- name
- description
- status
- created_at
- updated_at

### pastors
- id
- section_id
- pastor_name
- church_name
- contact_number
- email
- address
- status
- created_at
- updated_at

### events
- id
- name
- description
- date_from
- date_to
- venue
- registration_open_at
- registration_close_at
- total_capacity
- status
- created_at
- updated_at

### event_fee_categories
- id
- event_id
- category_name
- amount
- slot_limit (nullable)
- status
- created_at
- updated_at

### registrations
- id
- event_id
- pastor_id
- registration_mode
- encoded_by_user_id
- payment_status
- registration_status
- receipt_file_path (nullable)
- receipt_original_name (nullable)
- remarks (nullable)
- submitted_at
- verified_at (nullable)
- verified_by_user_id (nullable)
- created_at
- updated_at

### registration_items
- id
- registration_id
- fee_category_id
- quantity
- unit_amount
- subtotal_amount
- remarks (nullable)
- created_at
- updated_at

---

## 7.2 Relationships
- One district has many sections
- One section belongs to one district
- One section has many pastors
- One pastor belongs to one section
- One event has many event fee categories
- One registration belongs to one event
- One registration belongs to one pastor
- One registration has many registration items
- One registration item belongs to one fee category
- One user may be scoped to district, section, or pastor

---

## 8. Business Rules

### Access Control Rules
- Only admin can manage events
- Only admin can manage districts, sections, and pastors
- Manager access must be limited to assigned section
- Online registrant access must be limited to assigned pastor
- Registration staff can only perform onsite registration operations

### Registration Rules
- Registrations are quantity-based only
- No delegate-level personal information is required
- One registration can contain multiple fee categories
- One receipt can support multiple fee-category quantities
- Registration must fail if event is full or closed
- Event remaining slots must reflect all confirmed/reserved quantity

### Validation Rules
- Section cannot exist without district
- Pastor cannot exist without section
- Uploaded receipt must match allowed file types and size limits
- System should prevent invalid fee category selection for the event
- System should keep audit logs where practical

---

## 9. Recommended Screens

- Login
- Dashboard
- Event list
- Event form
- Event fee category setup
- User list
- User form
- District list/form
- Section list/form
- Pastor/church list/form
- Onsite registration page
- Online registration page
- Registration review/verification page
- Reports page

---

## 10. Decisions That Must Be Finalized Before Build

### Decision 1
Is one online registrant user tied to exactly one church/pastor?

**Recommendation:** Yes.

### Decision 2
Should online registrations count against capacity immediately, or only after verification?

**Recommendation:** Count immediately and mark as Pending Verification, or reserve slots temporarily.

### Decision 3
Can one receipt cover multiple fee-category quantities in a single registration?

**Recommendation:** Yes.

### Decision 4
Should manager access remain strictly section-based?

**Recommendation:** Yes.

---

## 11. User Stories

### Admin
- As an admin, I want to create events so that registration can be opened for church activities.
- As an admin, I want to configure fee categories per event so that different registration types can be supported.
- As an admin, I want to manage districts, sections, and pastors so that the church structure is maintained.
- As an admin, I want to manage users and roles so that access is controlled properly.

### Manager
- As a manager, I want to view and manage registrations in my assigned section so that I can oversee registrations operationally.
- As a manager, I want to review uploaded receipts so that online submissions can be verified.

### Registration Staff
- As a registration staff user, I want to create onsite registrations with quantities per fee category so that walk-in registrations can be recorded quickly.

### Online Registrant
- As an online registrant, I want to submit registrations for my assigned church/pastor so that I can register attendees online.
- As an online registrant, I want to upload payment proof so that my registration can be reviewed and accepted.
- As an online registrant, I want to see my registration status so that I know whether my submission is verified.

---

## 12. Acceptance Criteria

## 12.1 Event Management
- Admin can create an event with required fields
- Admin can add multiple fee categories to an event
- Non-admin users cannot manage events
- Event cannot accept registrations when closed or cancelled

## 12.2 User and Scope Management
- Admin can create users with role assignment
- Manager can only access registrations within assigned section
- Online registrant can only create/view registrations for assigned pastor

## 12.3 Onsite Registration
- Staff can create a registration without entering delegate details
- One onsite registration can contain multiple fee-category line items
- Quantities and subtotals are stored correctly
- Payment status can be recorded

## 12.4 Online Registration
- Online registrant can submit a registration for an open event
- Registration supports multiple fee-category line items
- Receipt upload is stored successfully
- Submission is blocked when event capacity is exceeded
- Registration is visible with status after submission

## 12.5 Reports
- Event Total Registration report shows total quantities by event and section
- No Registration report shows sections and pastors with no registration for selected event

---

## 13. Final Product Recommendation

The simplest stable version of this application should follow this model:

- One district
- Many sections under the district
- Many pastors/churches under sections
- One online registrant account per church/pastor
- One event with multiple fee categories
- One registration transaction with multiple fee-category quantities
- One uploaded receipt per registration transaction

This design is simple, maintainable, and aligned with the actual registration workflow.
