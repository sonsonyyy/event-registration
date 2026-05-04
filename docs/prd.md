# PRD: Church Event Registration Application

## Document Status
This PRD is aligned to the current repository implementation as of May 1, 2026. It should be used as the product baseline for future enhancements, not as a pre-build wishlist.

---

## 1. Product Overview

### Product Name
Church Event Registration Application

### Product Purpose
Provide one operational workspace for district event registration that supports:
- public event visibility
- church representative account requests
- onsite registration
- online registration with proof of payment
- scoped review and reporting

### Product Shape Today
The application is already implemented as an Inertia + React Laravel app with:
- public welcome and account-request flows
- authenticated admin and reviewer workspace
- church-based registrant workspace
- notification-driven review loops
- scoped reports and exports

### Core Product Position
This is a registration operations system, not a payment platform and not a delegate management system.

---

## 2. Product Goals

The current product is built to solve these operational needs:
- Centralize district and sectional event setup in one workspace
- Keep scope-sensitive authority clear across super admins, district admins, section managers, staff, and church registrants
- Let churches submit grouped registrations without exposing public self-registration
- Let reviewers verify uploaded receipts inside a structured queue
- Keep event capacity accurate while registrations move through review
- Give district and section leaders reporting they can act on

---

## 3. Primary Users

### 3.1 Super Admin
System owner with full access across all modules and scopes.

### 3.2 Admin
District-scoped operator responsible for district-level setup, reporting, online verification, and district-wide registration operations.

### 3.3 Manager
Section-scoped operator responsible for sectional event management, section review work, and section-level reporting.

### 3.4 Registration Staff
Operational encoder focused on onsite grouped registration.

### 3.5 Online Registrant
Church representative assigned to one pastor/church record and responsible for online submissions for that church.

---

## 4. Product Scope

### In Scope
- Public welcome page with live event availability
- Self-service church representative account request form
- Login, email verification, password reset, profile, password, and two-factor settings
- Department, district, section, pastor/church, and user management
- District and sectional event management
- Fee-category management inside event forms
- Onsite grouped registrations
- Online grouped registrations with receipt upload
- Registration verification with review history
- In-app notifications with realtime broadcast delivery
- Reports with search, section filters, pagination, and Excel export
- Soft-delete archiving for master data, users, events, and fee categories

### Explicitly Out of Scope
- Online payment processing
- Delegate-level attendee records
- QR code check-in
- Badge printing
- SMS workflow notifications
- Email workflow notifications beyond standard auth flows
- Public event registration without login

---

## 5. Operating Model

### 5.1 Territorial Scope
The product operates across:
- district scope
- section scope
- pastor/church scope

### 5.2 Department Scope
Privileged workflows use strict department matching:
- department-scoped users only match the same department
- no-department users only match records with no department
- no-department is not a wildcard lane

### 5.3 Action-Based Authority
The same user may have different permissions for:
- managing event records
- posting onsite registrations
- reviewing online registrations
- approving account requests
- viewing reports

The product intentionally separates those actions instead of using one broad access rule.

### 5.4 Title Metadata
Titles such as `President` or `Secretary` are stored as metadata only. They do not replace role-based access.

---

## 6. Current User Experience

### 6.1 Public Experience
Guests land on a welcome page that:
- lists currently open events
- shows remaining event slots
- shows remaining fee-category slots where applicable
- explains the registration flow
- answers common account-request and proof-of-payment questions

The page refreshes event availability through polling so capacity changes appear without a full reload.

### 6.2 Church Representative Access Request
Guests can request a registrant account through the public access-request form.

Current business behavior:
- the request captures representative identity plus section and pastor/church assignment
- the request creates an active `Online Registrant` account in `pending` approval state
- each church may have at most two active or pending registrant accounts
- approval unlocks online registration routes
- pending or rejected requestors can still sign in and see the dashboard notice

### 6.3 Admin and Reviewer Workspace
Authenticated privileged users work from a scoped dashboard with:
- quick actions
- notification count and recent notifications
- open event visibility
- recent scoped registrations
- role-specific metrics

### 6.4 Registrant Workspace
Approved online registrants can:
- see only accessible district and same-section events
- submit grouped registrations with receipt upload
- review current registration status
- edit correctable submissions
- cancel unverified submissions
- open their own stored receipts

---

## 7. Functional Requirements

### 7.1 Identity and Access
The implemented product must:
- support `Super Admin`, `Admin`, `Manager`, `Registration Staff`, and `Online Registrant`
- require territorial scope assignments where the role needs them
- keep `Super Admin` as a system-level global override
- restrict registrants to one pastor/church assignment
- keep department matching strict for privileged event workflows

Current approval behavior:
- `Super Admin` can review all self-service account requests
- `Admin` can review requests across the assigned district
- `Manager` can review requests inside the assigned section
- department does not restrict account-request approval

### 7.2 Master Data and User Management
The product must support CRUD plus archive behavior for:
- departments
- districts
- sections
- pastors/churches
- users

Current constraints:
- the standard user form exposes `Admin`, `Manager`, `Registration Staff`, and `Online Registrant`
- managers must have a section
- registration staff must have a district
- online registrants must have a pastor
- admin users are limited to managing users inside their district

### 7.3 Event Management
The product must support:
- district-wide events
- sectional events
- optional department ownership on either scope
- inline fee-category setup inside event create/edit flows

Current authority rules:
- `Admin` manages district-wide events only
- `Manager` manages sectional events only
- both still require matching territorial and department scope

Current event model includes:
- name and description
- venue
- event date range
- registration window
- capacity
- status
- scope type
- district, section, and department ownership

### 7.4 Fee Categories
Each event can contain multiple fee categories with:
- name
- amount
- optional slot limit
- active or inactive status

Current product behavior:
- registration create flows only expose active fee categories
- fee-category capacity can be unlimited or slot-limited
- fee-category totals are included in reports

### 7.5 Onsite Registration
The onsite flow must allow authorized users to:
- pick an event
- pick a pastor/church
- add one or more grouped line items
- store a receipt or manual reference number
- save the transaction

Current workflow behavior:
- onsite registrations are grouped, not delegate-based
- onsite submissions are stored as `paid`
- onsite submissions are stored as `completed`
- onsite submission does not send workflow notifications

Current access rules:
- `Registration Staff` is the primary onsite encoder role
- `Admin` may post only for district-wide events in the assigned district
- `Manager` may post only for churches inside the assigned section

### 7.6 Online Registration
The online flow must allow approved registrants to:
- select an accessible open event
- submit grouped line items
- enter a payment reference
- upload proof of payment
- view registration history
- view latest review and review history
- edit or cancel when still allowed

Current workflow behavior:
- submission requires a payment reference
- submission requires a receipt file
- submission reserves capacity immediately
- submission stores `payment_status = paid`
- submission stores `registration_status = pending verification`
- correction resubmission notifies reviewers again
- cancellation releases capacity

### 7.7 Verification and Review
The review flow must allow authorized reviewers to:
- browse a scoped verification queue
- open uploaded receipts
- verify a registration
- reject a registration
- return a registration for correction
- store reason, notes, reviewer, and timestamp

Current review audience:
- `Super Admin`
- `Admin` for district-wide events in the assigned district and matching department lane
- `Manager` for section registrations in the assigned section, including district-wide events affecting that section

### 7.8 Notifications
The product must provide in-app workflow notifications for:
- new account requests
- account request approval
- account request rejection
- registration submission
- registration return for correction
- registration resubmission
- registration verification
- registration rejection

Current delivery model:
- database notifications are the persisted source of truth
- broadcast delivery updates authenticated users in realtime
- notification menu supports single-read and mark-all-read actions

### 7.9 Reporting
The reporting module must allow authorized users to:
- select an accessible event
- optionally filter by section when allowed
- review event total registration
- review fee-category totals
- review section summaries
- review churches with registration
- review churches without registration
- export the two church lists as Excel files

Current access rules:
- `Super Admin` can report across all accessible events
- `Admin` can report across district events in the assigned department lane
- `Manager` can report only their own section data
- `Registration Staff` and `Online Registrant` cannot access reports

### 7.10 Dashboard and Settings
The authenticated workspace must provide:
- role-aware quick actions
- role-aware summary metrics
- open event visibility
- recent registration visibility
- notification visibility
- registrant approval notices where needed
- profile, password, and two-factor settings

---

## 8. Key Business Rules

### 8.1 Event Ownership
- Every event stores `district_id`
- District events keep `section_id = null`
- Sectional events store both `district_id` and `section_id`
- Event ownership does not automatically grant report or verification access without the matching action rule

### 8.2 Department Matching
- Privileged users and events must match department exactly
- Registrants are not department-scoped
- Account request approval ignores department

### 8.3 Registrant Access Requests
- A church can have at most two active or pending registrant accounts
- Self-service requests start in pending approval
- Admin-created registrants start approved by default through database defaults

### 8.4 Capacity Reservation
These registration states reserve slots:
- `submitted`
- `pending verification`
- `needs correction`
- `verified`
- `completed`

These states release or avoid reservation:
- `draft`
- `rejected`
- `cancelled`

### 8.5 Historical Preservation
- Users, master data, events, and fee categories are archived with soft deletes
- Registrations and review history remain durable records
- Reports continue to support historical lookup against archived relationships

---

## 9. Storage and Delivery Requirements

### 9.1 Receipt Storage
The product stores online registration receipts on a configurable disk.

Current environment behavior:
- non-production defaults to `local`
- production defaults to `s3`

### 9.2 Receipt Access
Receipt files must remain authorization-controlled.

Current implementation behavior:
- local storage is served through the application
- S3 storage uses temporary URLs
- missing files return `404`

### 9.3 Production Expectation
Production receipt storage is expected to use S3-compatible object storage with required bucket and region configuration.

---

## 10. Current Product Baseline

The repository currently demonstrates the following baseline:
- one public welcome flow
- one public self-service registrant access-request flow
- one scoped admin/reviewer workspace
- one scoped registrant workspace
- quantity-based onsite and online registration
- proof-of-payment upload plus receipt review
- strict district, section, and department aware authorization
- in-app realtime workflow notifications
- scoped reporting with export

This baseline should be treated as the contract for future work unless a later change explicitly expands or replaces it.

---

## 11. Event Check-in Module

### 11.1 Module Purpose
The Event Check-in module will support event-day registration booth operations where authorized users can confirm a church's registered quantities, release or claim event kits, and log attendance quantities for the selected event.

This module keeps the product aligned with its quantity-based registration model. It does not introduce delegate-level attendee records, QR code check-in, or badge printing.

### 11.2 Recommended Product Term
The primary module name should be **Event Check-in**.

Within the module, the operational workflow should use the more specific label **Kit Claiming & Attendance** because the event-day process is focused on:
- confirming registered church quantities
- recording kit claims
- logging attendance quantities by church and fee category

The navigation item should use a distinct kit or package-style icon so it does not visually duplicate Verification.

### 11.3 In Scope
The Event Check-in module should allow authorized users to:
- select an accessible event
- search and filter churches registered for the event
- view church-level registered quantities across multiple transactions
- view registration breakdown by fee category
- record kit claims by quantity
- record the representative name claiming the kits
- capture remarks where needed
- support partial and multiple kit claims for the same church
- view claim history for the church and event
- report claimed, unclaimed, and remaining quantities

### 11.4 Explicitly Out of Scope for This Module
The Event Check-in module should not introduce:
- delegate-level attendee profiles
- individual attendee check-in
- QR code scanning
- badge printing
- public self-check-in
- payment collection workflow

### 11.5 Event-Day Workflow
The recommended event-day workflow is:
1. Booth staff selects the event.
2. Booth staff searches for the church or pastor record.
3. The system displays all claimable registrations for that church and event.
4. The system summarizes registered quantities by fee category.
5. Booth staff enters the quantities being claimed.
6. Booth staff records the representative name and optional remarks.
7. The system stores the claim log and updates the church's claim status.

### 11.6 Claim Statuses
Each church's event check-in status should be derived from the registered quantity and claimed quantity:
- `not claimed` when no kits or attendance quantities have been claimed
- `partially claimed` when some but not all registered quantities have been claimed
- `fully claimed` when all registered quantities have been claimed

### 11.7 Claimable Registration Rules
Only registrations that are safe to honor should be claimable.

Online registrations should be claimable only when the registration status is:
- `verified`
- `completed`

Onsite registrations should be claimable when the registration status is:
- `completed`

Registrations should not be claimable when the registration status is:
- `draft`
- `submitted`
- `pending verification`
- `needs correction`
- `rejected`
- `cancelled`

### 11.8 Access Rules
Event Check-in access should follow the same scope-aware authority model used by privileged registration workflows.

Recommended access behavior:
- `Super Admin` can process check-ins for all events and churches.
- `Admin` can process check-ins for district-wide events in the assigned district and matching department lane.
- `Manager` can process check-ins only for churches in the assigned section, including district-wide events that affect the manager's section.
- `Registration Staff` is the primary booth role and can process check-ins within the assigned district, optional section, and optional department lane.
- `Online Registrant` cannot process check-ins, but may later be allowed to view their own church's check-in or claim status if needed.

### 11.9 Recommended User Experience
The Event Check-in page should be an event-first booth workspace instead of a standard CRUD page.

Recommended layout:
- event selector at the top
- concise workspace description: `Claim kits and track attendance by church.`
- scope indicator chips based on the current user
- event-day summary cards
- full-width fee-category progress card
- church search and filters
- full-width church-level table showing registered, claimed, and remaining quantities
- right-side drawer for the selected church
- fee-category claim form inside the drawer
- claim history inside the drawer

Recommended summary cards:
- Registered Qty
- Claimed Qty
- Remaining Qty
- Not Yet Claimed

Recommended table columns:
- Church
- Section
- Registered Qty
- Claimed Qty
- Remaining Qty
- Claim Status
- Last Claim
- Action

Recommended drawer content:
- selected church summary
- registered quantity by fee category
- already claimed quantity by fee category
- remaining quantity by fee category
- quantity-to-claim inputs that allow staff to clear and replace `0` values cleanly before submit
- representative name field
- remarks field
- confirm claim action
- claim history

### 11.10 Reporting Expectations
Event Check-in reporting should support:
- total registered quantity
- total claimed quantity
- total remaining quantity
- churches not claimed
- churches partially claimed
- churches fully claimed
- fee-category claim totals
- section-level claim progress where the user's scope allows it

Managers should continue to see only their own section data even for district-wide events.
