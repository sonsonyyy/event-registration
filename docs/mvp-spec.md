# Church Event Registration Application – MVP Specification

## Goal
Build a simple district-level church event registration application that supports both **onsite registration** and **online church-based registration** without online payment processing. Online registrants will upload a **receipt / proof of payment** instead.

---

## 1. Scope Summary
The system will support:

- Event setup and fee configuration
- District / section / pastor master data
- User and role management
- Onsite registration
- Online registration per church / pastor
- Receipt upload for payment proof
- Capacity tracking and registration limits
- Reports by event and section

---

## 2. User Roles

### Admin
Full access to the whole system.

**Permissions:**
- Manage events
- Manage users
- Manage districts, sections, pastors
- Manage registrations
- View all reports
- Approve / verify uploaded receipts if needed

### Manager
Operational access with limited administration.

**Permissions:**
- Manage registrations
- View reports
- Section-based access only
- Cannot manage events
- Cannot manage pastors / sections

### Registration Staff
Used for onsite event registration.

**Permissions:**
- Register delegates onsite
- View event availability
- Search churches / pastors
- Print or view registration record if needed

### Online Registrant
Given access to register delegates for a specific church / pastor.

**Permissions:**
- Log in
- Register delegates for their assigned church / pastor
- Upload payment receipt / proof of payment
- View registration history / status

---

## 3. Main Modules

### A. Event Management
Admin can create, edit, and delete events.

#### Event Fields
- Event name
- Description
- Date from
- Date to
- Venue
- Registration opening date
- Registration closing date
- Status (`Draft`, `Open`, `Closed`, `Completed`, `Cancelled`)
- Total capacity / delegate limit
- Remaining slots (computed)

#### Event Fee Types
Each event can have multiple fee categories, for example:
- `Regular (Online)`
- `Regular (Onsite)`
- `One-day Pass`

#### Fee Setup Fields
- Fee category name
- Amount
- Optional slot allocation per category
- Is active

#### Event Rules
- Registration closes automatically when total capacity is reached
- Registration closes when closing date is reached
- Prevent registration if event is closed or cancelled
- Show remaining slots in real time

---

### B. User Management
Admin can create and manage users.

#### User Fields
- Full name
- Username / email
- Password
- Role
- Assigned district / section / pastor if needed
- Status (`Active`, `Inactive`)

#### Role Assignment Rules
- **Admin:** global access
- **Manager:** section-based access
- **Registration Staff:** onsite registration only
- **Online Registrant:** limited to assigned pastor record

---

### C. District Management
Admin can add, edit, and delete districts.

#### District Fields
- District name
- Description (optional)
- Status

---

### D. Section Management
Each section belongs to a district.

#### Section Fields
- Parent district
- Section name
- Description (optional)
- Status

---

### E. Pastor Management
Each pastor belongs to a section.

#### Pastor Fields
- Parent section
- Pastor full name
- Church name
- Contact number
- Email (optional)
- Address (optional)
- Status

> Since the online registrant registers on behalf of a church/pastor, the pastor record may effectively represent the local church account owner.

---

### F. Onsite Registration Page
Used by registration staff, manager, or admin.

#### Functions
- Select event
- Search existing pastor / church
- Add registration line items in a single transaction
- Choose fee category
- Enter quantity per fee category
- Add another fee category with another quantity within the same transaction
- Save the transaction as paid
- Record OR number / manual receipt reference
- Print or show confirmation

#### Onsite Registration Structure
Instead of capturing delegate details, the onsite registration page should allow quantity-based registration.

Each onsite transaction may contain multiple registration line items, for example:
- `Regular (Onsite) x 10`
- `One-day Pass x 3`

This means a single registration record can contain multiple fee categories with corresponding quantities.

#### Onsite Payment Status
- Onsite transactions are recorded as `Paid` in the current MVP.
- `Unpaid` and `Partial` remain reserved in the data model for future workflow expansion.

---

### G. Online Registration Page
Used by the Online Registrant user assigned to a church / pastor.

#### Functions
- Select open event
- Add one or multiple registration line items
- Choose fee category per group of delegates
- Enter quantity per fee category
- Upload proof of payment / receipt
- Submit registration
- Track registration status

#### Online Registration Rules
- Online registrant can only register delegates for their assigned church / pastor
- System validates capacity before submission
- Receipt / reference number is required before final submission
- Proof of payment is required before final submission
- Registration may remain under status:
  - `Pending Verification`
  - `Verified`
  - `Rejected`

#### Receipt Upload
- File types: `JPG`, `PNG`, `PDF`
- Max file size configurable
- Store upload date/time
- Store uploaded by
- Allow admin/manager to review

---

### H. Reports

#### Required Reports

1. **Event Total Registration**
   - Filter by event
   - Filter by section
   - Show total registered count
   - Show counts per fee category
   - Show verified vs pending if online receipt verification is used

2. **No Registration Report**
   - Show sections / pastors with no registration for a selected event

#### Recommended Additional Reports
- Remaining slots by event
- Registration summary by district
- Registration summary by pastor/church
- Payment summary based on submitted receipt totals or marked payments

---

## 4. Core Workflow

### Event Setup
1. Admin creates district, sections, pastors/churches
2. Admin creates event
3. Admin sets fee categories and capacity
4. Admin creates users and assigns roles
5. Admin opens registration

### Online Registration Flow
1. Online registrant logs in
2. Selects event
3. Adds registration line items under assigned church/pastor
4. Uploads proof of payment
5. Submits registration
6. Admin/manager verifies receipt if needed
7. Registration becomes verified/approved

### Onsite Registration Flow
1. Staff selects event
2. Searches or selects church/pastor
3. Adds one or more registration line items
4. Chooses fee category for each line item
5. Enters quantity for each fee category
6. Records payment status
7. Saves registration

---

## 5. Recommended Registration Statuses

### Registration Record Status
- `Draft`
- `Pending Verification`
- `Verified`
- `Rejected`
- `Cancelled`

### Payment Status
- `Unpaid`
- `Paid`
- `Partial`
- `For Verification`

The data model keeps these values for future payment workflows. In the current MVP, both onsite and online submissions are recorded as `Paid`.

---

## 6. Suggested Database Entities

### `users`
- `id`
- `name`
- `email` / `username`
- `password`
- `role_id`
- `pastor_id` (nullable)
- `section_id` (nullable)
- `district_id` (nullable)
- `status`
- `created_at`
- `updated_at`

### `roles`
- `id`
- `name`

### `districts`
- `id`
- `name`
- `description`
- `status`

### `sections`
- `id`
- `district_id`
- `name`
- `description`
- `status`

### `pastors`
- `id`
- `section_id`
- `pastor_name`
- `church_name`
- `contact_number`
- `email`
- `address`
- `status`

### `events`
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

### `event_fee_categories`
- `id`
- `event_id`
- `category_name`
- `amount`
- `slot_limit` (nullable)
- `status`

### `registrations`
- `id`
- `event_id`
- `pastor_id`
- `registration_mode` (`onsite` / `online`)
- `encoded_by_user_id`
- `payment_status`
- `registration_status`
- `receipt_file_path` (nullable)
- `receipt_original_name` (nullable)
- `remarks`
- `submitted_at`
- `verified_at` (nullable)
- `verified_by_user_id` (nullable)

### `registration_items`
- `id`
- `registration_id`
- `fee_category_id`
- `quantity`
- `unit_amount`
- `subtotal_amount`
- `remarks` (nullable)

> This structure allows one registration submission to contain multiple fee-category line items and one uploaded receipt.

---

## 7. MVP Validation Rules
- Prevent duplicate active event names if desired
- Prevent section creation without district
- Prevent pastor creation without section
- Prevent online user registration outside assigned pastor
- Prevent registration when event is full or closed
- Validate receipt upload type and size
- Keep audit trail for create/edit/delete actions if possible

---

## 8. Recommended MVP Screens
1. Login
2. Dashboard
3. Event List / Event Form
4. Event Fee Category Setup
5. User List / User Form
6. District List / Form
7. Section List / Form
8. Pastor / Church List / Form
9. Onsite Registration Page
10. Online Registration Page
11. Registration Review / Verification Page
12. Reports Page

---

## 9. Important Decisions to Finalize
These should be decided before development starts:

1. **Is one online registrant user tied to exactly one church/pastor?**
   - Recommended: Yes, for simplicity and security.

2. **Should online registrations require admin approval before counting toward capacity?**
   - Recommended: Count them immediately but mark as `Pending Verification`, or reserve slots for a limited time.

3. **Can one receipt cover multiple fee-category quantities in one registration?**
   - Recommended: Yes.

4. **Will manager access be district-wide or section-based?**
   - Recommended: Section-based.

---

## 14. Final Recommendation
This is a very workable internal application. The simplest clean design is:

- One district
- Many sections under the district
- Many pastors/churches under sections
- One online registrant account per church
- One event with many fee categories
- One registration submission with multiple fee-category quantities and one receipt upload

That model will stay simple, secure, and easy to maintain.
