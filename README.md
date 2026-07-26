# HR & Payroll Tool

Internal tool for managing employee records, leave requests and payroll, built to replace the spreadsheet + WhatsApp approval chaos growing teams end up with.

**Status:** In active development. Backend core (Employee Records, Leave Management, Payroll) is complete and tested. Frontend dashboard is in progress .

---

## Tech Stack

- **Backend:** Express (Node.js)
- **Database:** SQLite (via `better-sqlite3`)
- **Frontend:** HTML/CSS/vanilla JS *(in progress)*
- **Testing:** Jest + Supertest

---

## What I Prioritized and Why

The brief noted one or two modules done properly beats three done shallowly. I chose to build all three at moderate-to-full depth, since Leave and Payroll are explicitly meant to interact, and I wanted that interaction to be real rather than stubbed. Backend business logic (the part described as the core of the exercise) was prioritized over frontend polish the API is fully functional and tested; the dashboard is the remaining piece.

---

## Setup & Running Locally

```bash
git clone <https://github.com/mwangi-kennedy/hr-payroll-tool>
cd hr-payroll-tool
npm install
```


Run the migration to create tables:
```bash
npm run migrate
```

Start the server:
```bash
npm run dev
```

Run tests:
```bash
npm test
```

---

## API Reference

### Employees
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/employees` | List active employees |
| POST | `/api/employees` | Create an employee |
| GET | `/api/employees/org-view` | Nested org chart (who reports to whom) |
| PATCH | `/api/employees/:id/deactivate` | Deactivate (soft delete payroll history persists) |

### Leave
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/leave` | Submit a leave request |
| GET | `/api/leave?status=pending` | List requests, optionally filtered by status |
| PATCH | `/api/leave/:id/decision` | Approve or reject a request |

### Payroll
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/payroll/generate` | Generate payroll for a `{month, year}` period |
| GET | `/api/payroll/:year/:month` | Retrieve a generated payroll run |
| GET | `/api/payroll/runs` | List all generated payroll runs |

---

## Leave Management — Problems Identified & Safeguards Built

Spreadsheets don't catch these, so the system enforces them directly:

1. **Insufficient notice.** Requests submitted with less than 3 days' notice are flagged (`low_notice: true`) rather than blocked outright — a manager should see the urgency, but genuine emergencies shouldn't be hard-rejected by the system.
2. **Team under-coverage.** Approving a request is blocked if more than 50% of that employee's active team would be on approved leave during the same window. This is the "whole team out at once" problem that's invisible in a spreadsheet until it's already happened.
3. **Unanswered requests.** Any pending request older than 2 days is flagged as `escalated: true` in the list view, so requests don't silently sit unanswered.

---

## Payroll — Formula & Assumptions

**Tax:** Progressive brackets, calculated on marginal income (not flat on the whole amount):
| Bracket | Rate |
|---|---|
| Up to 24,000 | 0% |
| 24,000 – 40,000 | 15% |
| Above 40,000 | 25% |

**Social Security:** 6% of gross pay, capped at 2,160 flat.

**Proration:** Daily rate = monthly salary ÷ calendar days in that month. Gross pay = daily rate × (days actually worked − approved unpaid leave days in that period). This same daily-rate logic handles both unpaid leave and mid-month joiners, since both are just "fewer effective days worked."

**Edge cases handled (with tests):**
- Mid-month joiner — prorated to actual days employed within the period
- Zero-deduction case — an employee on unpaid leave for the entire period nets to exactly 0
- Salary at a bracket boundary — verified no cliff effect, since tax is marginal
- Duplicate generation for the same period is blocked (`409` response)

**Assumptions stated plainly:** calendar days are used as the denominator, not working/business days; tax brackets and social security rate are illustrative, not modeled on a specific country's real tax code.

---

## Testing

Two test suites, focused on the logic the brief calls out as mattering most:

- `src/tests/leave.test.js` — leave request validation and notice-period flagging
- `src/tests/payroll.test.js` — tax calculation (including bracket boundaries), social security capping and full payroll generation covering mid-month joiner, zero-deduction, and duplicate-run cases

---

## What's Left

- Frontend dashboard: pending approvals, who's out/when, leave balances, payslips by period
- Submit/approve leave and generate-payroll controls with empty/loading states
- SQL dump export (schema + sample data) for submission
- Additional test coverage on the org-hierarchy and deactivate logic

## What I'd Improve With More Time

- Leave balance tracking (accrual, not just request/approve)
- Configurable tax brackets and social security rules instead of hardcoded constants
- Authentication/roles (currently no login — anyone can hit any endpoint)
