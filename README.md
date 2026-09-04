# Event Registration

A Laravel and Inertia React application for managing church event registrations across districts, sections, departments, and churches.

The system supports public event discovery, church representative account requests, onsite registration, online registration with proof-of-payment uploads, registration review workflows, realtime in-app notifications, check-in tracking, and scoped reporting.

## Tech Stack

- Laravel 12
- PHP 8.3
- Laravel Sail
- Inertia.js 2 with React 19
- TypeScript
- Tailwind CSS 4
- Laravel Fortify
- Laravel Reverb
- Laravel Wayfinder
- Pest 4
- MySQL 8.4

## Core Features

- Public welcome page with open events and reservation-aware capacity
- Self-service church representative access requests
- Role-based workspaces for Super Admin, Admin, Manager, Registration Staff, and Online Registrant users
- District, section, department, pastor/church, user, and event management
- Event fee categories with optional slot limits
- Onsite grouped registration encoding
- Online grouped registration with receipt uploads
- Registration verification, return-for-correction, rejection, and approval flows
- In-app workflow notifications with realtime broadcasting
- Event check-in tracking
- District and section scoped reports with Excel exports
- Soft-delete archiving for master data, users, events, and fee categories

## Requirements

- Docker
- Laravel Sail
- Composer dependencies installed for `vendor/bin/sail`
- Node dependencies installed through Sail for frontend development

## Local Setup

Copy the environment file:

```bash
cp .env.example .env
```

Start the Sail containers:

```bash
vendor/bin/sail up -d
```

Install backend dependencies:

```bash
vendor/bin/sail composer install
```

Install frontend dependencies:

```bash
vendor/bin/sail npm install
```

Generate the application key:

```bash
vendor/bin/sail artisan key:generate
```

Run the migrations and seeders:

```bash
vendor/bin/sail artisan migrate --seed
```

Build the frontend assets:

```bash
vendor/bin/sail npm run build
```

Open the app at:

```text
http://localhost
```

## Development

Start the application services:

```bash
vendor/bin/sail up -d
```

Run the Vite development server:

```bash
vendor/bin/sail npm run dev
```

Run the full Laravel development stack defined in `composer.json`:

```bash
vendor/bin/sail composer run dev
```

Stop the containers:

```bash
vendor/bin/sail stop
```

## Testing and Quality

Run the test suite:

```bash
vendor/bin/sail artisan test --compact
```

Run a specific test file:

```bash
vendor/bin/sail artisan test --compact tests/Feature/Registration/OnlineRegistrationTest.php
```

Run PHP formatting:

```bash
vendor/bin/sail bin pint --dirty --format agent
```

Run frontend linting:

```bash
vendor/bin/sail npm run lint:check
```

Run TypeScript checks:

```bash
vendor/bin/sail npm run types:check
```

Run Prettier checks for frontend resources:

```bash
vendor/bin/sail npm run format:check
```

## Seed Data

The default database seeders create the core roles, departments, demo church hierarchy, pastor roster, sample event, and privileged users.

Seeded local users use the password:

```text
password
```

See the user seeders in `database/seeders` for the current seeded accounts.

## Roles and Access

- `Super Admin`: global access across all modules and scopes
- `Admin`: district-scoped administration, reporting, event operations, and review work
- `Manager`: section-scoped event operations, account approval, verification, and reports
- `Registration Staff`: onsite registration encoding
- `Online Registrant`: church representative access for online grouped registrations

Authorization combines role, territorial scope, department scope, and action type. Department matching is intentionally strict for privileged event, registration, verification, and reporting workflows.

## Main Workflows

### Public Access

Guests can view currently open events on the welcome page. Church representatives can request online registrant access at:

```text
/church-representative-access
```

The path is configurable through `REGISTRANT_ACCESS_PATH`.

### Online Registration

Approved online registrants can create grouped registrations for events available to their assigned pastor/church. Online submissions require a payment reference and receipt upload, then move through the verification queue.

### Onsite Registration

Authorized staff can encode grouped onsite registrations, select an event and church, add registration line items, and store manual receipt or payment reference details.

### Verification

Eligible reviewers can inspect uploaded receipts, approve registrations, reject submissions, return submissions for correction, or alter registration details when authorized.

### Reporting

Reports are scoped by user authority and include church registration coverage, onsite collection views, filtering, pagination, and Excel exports.

## Storage and Uploads

Receipt upload behavior is configured in `config/registration.php` and `.env`.

Important environment keys:

```text
ONLINE_REGISTRATION_RECEIPTS_DISK=local
ONLINE_REGISTRATION_RECEIPT_MAX_KB=5120
ONLINE_REGISTRATION_RECEIPT_DIRECTORY=registration-receipts
ONLINE_REGISTRATION_RECEIPT_URL_TTL_MINUTES=5
EVENT_BANK_QR_CODE_DISK=public
EVENT_BANK_QR_CODE_MAX_KB=2048
```

Use S3-compatible storage in production by setting the receipt disk and AWS environment variables.

## Realtime Notifications

The app uses Laravel Reverb for realtime notification delivery. Local Reverb configuration is included in `.env.example`, and the Sail compose file exposes the Reverb port.

## Project Notes

- Application routes are defined in `routes/web.php` and `routes/settings.php`.
- Product documentation lives in `docs/prd.md` and `docs/spec.md`.
- Frontend pages live in `resources/js/pages`.
- Shared React components live in `resources/js/components`.
- Domain rules are covered by feature tests under `tests/Feature`.
