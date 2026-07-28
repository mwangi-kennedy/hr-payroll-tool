# HR & Payroll Tool

A small implementable internal tool for managing employee records, leave requests and payroll replacing spreadsheet-and-WhatsApp workflows with a system that has real business logic behind it.

---

## What I Prioritized and Why

The brief noted that one or two modules done properly beats three done shallowly. I chose to build all three at meaningful depth because Leave and Payroll are explicitly required to interact and I wanted that interaction to be real and thoroughly tested rather than stubbed. 
Within that scope, backend business logic—the core of the exercise was prioritized over frontend visual design. The API is fully functional, handles every named edge case, and includes unit/integration tests. The frontend dashboard covers every required view with clean, functional UI and loading states.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Backend | Express (Node.js) |
| Frontend | HTML / CSS / Vanilla JavaScript |
| Database | PostgreSQL (`pg` driver + Supabase) |
| Testing | Jest + Supertest |

---

## Architecture & Approach

The backend follows a layered structure:
- **Routes (`src/routes/`):** Handle HTTP endpoints and request routing.
- **Controllers (`src/controllers/`):** Manage request validation and HTTP responses.
- **Services (`src/services/`):** Pure, isolated business logic (tax calculations, leave rule thresholds) kept separate from HTTP and database concerns for direct unit testing.
- **Database (`src/db/`):** Connection pooler setup using `pg` connecting directly to PostgreSQL / Supabase.

```
HR-PAYROLL-TOOL/
├── db/
├── node_modules/
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   └── app.js
│   └── index.html
├── scripts/
├── src/
│   ├── controllers/
│   ├── db/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   ├── app.js
│   └── server.js
├── :memory:
├── .env
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
```

The frontend is a single-page dashboard with tab-based navigation, calling the API directly via `fetch` no build step or framework, per the brief's constraints.

---

## Modules

### 1. Employee Records

- **Data Model:** Name, role, team, manager, start date, salary, and employment type.
- **Org View:** Managers are modeled as a self-referencing relationship (`manager_id` → `employees.id`), powering a nested organizational tree view.
- **Soft Deletion:** Employees are **deactivated, not deleted** (`is_active = 0`). This ensures historical payroll and leave records persist for audit compliance.

### 2. Leave Management

Employees submit leave requests; managers approve or reject them. Beyond basic CRUD, three safeguards address problems a spreadsheet-based process doesn't catch:

| Problem | Safeguard |
|---|---|
| Requests submitted with little warning | Requests with less than 3 days' notice are flagged (`low_notice: true`) rather than blocked visible to the manager, without rigidly rejecting genuine emergencies |
| A team becoming under-covered | Approval is blocked if it would push more than 50% of an employee's active team onto approved leave at the same time |
| Requests left unanswered | Any request still pending after 2 days is flagged (`escalated: true`) in the list view |

**Interaction with Payroll:** approved leave marked `unpaid` reduces an employee's effective worked days for any payroll period it overlaps, directly lowering that period's gross pay. This is the mechanism connecting the two modules and is covered by an integration test.

### 3. Payroll

Generates one payslip per active employee for a given month/year: gross pay, statutory deductions and net pay.

**Formula:**
- Daily rate = monthly salary ÷ calendar days in that month
- Gross pay = daily rate × (days actually employed in the period − approved unpaid leave days in that period)
- Tax is calculated on **marginal** income across progressive brackets (not flat on the whole amount):

  | Bracket | Rate |
  |---|---|
  | Up to 24,000 | 0% |
  | 24,000 – 40,000 | 15% |
  | Above 40,000 | 25% |

- Social security = 6% of gross pay, capped at 2,160 flat
- Net pay = gross pay − tax − social security

**Edge cases handled and tested:**
- Mid-month joiners are prorated to their actual employed days within the period
- An employee whose gross pay falls entirely below the tax threshold pays 0 tax (zero-deduction case)
- Salaries sitting at a bracket boundary are verified to have no cliff effect, since tax is marginal
- Regenerating payroll for an already-processed period is blocked (`409 Conflict`)

**Stated assumptions:** calendar days are used as the denominator, not working days; tax brackets and the social security rate are illustrative rather than modeled on a specific country's real tax code.

---

## Frontend

A single dashboard covering:
- **Pending approvals**, with inline approve/reject controls
- **Who's out**, showing current and upcoming approved leave
- - **Employees**, displaying a list of employees, adding an employee and thier team
- **Leave balances** per employee (fixed annual allocation minus approved paid leave taken)
- **Payslips for a selected period**, with a form to generate a new payroll run

All list views show an explicit empty state (e.g. "No pending requests") rather than a blank screen, and a loading state while data is being fetched.

---

## What I Added Beyond the Brief

- **Downloadable CSV payslips.** Any generated payroll period can be exported as a CSV directly from the dashboard useful for record-keeping or sharing outside the browser. Chosen over PDF to stay within the project's time budget while still solving the real "I need this offline" need, without introducing a new dependency.

- **Leave balance tracking.** Not explicitly required, but implied by the dashboard spec ("leave balances"); implemented as a fixed annual allocation (21 days) minus approved paid leave taken in the current year.

---

## Setup & Running Locally

```bash
git clone https://github.com/mwangi-kennedy/hr-payroll-tool
cd hr-payroll-tool
npm install
```

Create a `.env` file in the project root:
```
DATABASE_URL
```
Create the database schema:
```bash
psql "$DATABASE_URL" < db/dump.sql
```

**Optional — load the submitted sample data** (a few employees/teams, leave requests in different states, one generated payroll run) instead of starting empty:
```bash
sqlite3 src/db/database.db < db/dump.sql
```
Run this immediately after `npm run migrate`, before starting the server.

Start the server:
```bash
npm run dev
```

Visit `http://localhost:3000` for the dashboard.

Run the automated test suite:
```bash
npm test
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/teams` | List teams |
| POST | `/api/teams` | Create a team |
| GET | `/api/employees` | List active employees |
| POST | `/api/employees` | Create an employee |
| GET | `/api/employees/org-view` | Nested org chart |
| PATCH | `/api/employees/:id/deactivate` | Deactivate (soft delete) |
| POST | `/api/leave` | Submit a leave request |
| GET | `/api/leave?status=pending` | List requests, optionally filtered |
| GET | `/api/leave/balances` | Leave balances per employee |
| PATCH | `/api/leave/:id/decision` | Approve or reject a request |
| POST | `/api/payroll/generate` | Generate payroll for a period |
| GET | `/api/payroll/:year/:month` | Retrieve a payroll run |
| GET | `/api/payroll/:year/:month/download-csv` | Download payslips as CSV |
| GET | `/api/payroll/runs` | List all payroll runs |

---

## Testing

Two suites, focused on the logic the brief identifies as mattering most:

- `src/tests/leave.test.js` — request validation, notice-period flagging
- `src/tests/payroll.test.js` — tax calculation across brackets and boundaries, social security capping, and full payroll generation covering mid-month joiner, zero-deduction, and duplicate-run cases

```bash
npm test
```

---

## What I'd Improve With More Time

- Accrual-Based Leave: Shift from fixed annual leave allocations to monthly accrual tracking.
- Configurable Tax Brackets: Move tax brackets and social security thresholds out of service logic into database configuration tables.
- Role-Based Authentication: Implement JWT-based auth separating manager approval endpoints from regular employee views.
- PDF payslip export instead of CSV, for a more polished offline document
