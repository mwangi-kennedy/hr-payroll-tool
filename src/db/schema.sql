CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    team_id INTEGER REFERENCES teams(id),
    manager_id INTEGER REFERENCES employees(id),
    start_date TEXT NOT NULL,
    salary REAL NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time','part_time','contract')),
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days_requested INTEGER NOT NULL,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('paid','unpaid')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reason TEXT,
    requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
    decided_at TEXT,
    decided_by INTEGER REFERENCES employees(id)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_month, period_year)
);

CREATE TABLE IF NOT EXISTS payslips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payroll_run_id INTEGER NOT NULL REFERENCES payroll_runs(id),
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    gross_pay REAL NOT NULL,
    unpaid_leave_days INTEGER NOT NULL DEFAULT 0,
    tax_deduction REAL NOT NULL,
    social_security_deduction REAL NOT NULL,
    net_pay REAL NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);