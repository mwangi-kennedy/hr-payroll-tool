PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE
);
INSERT INTO teams VALUES(1,'Engineering');
INSERT INTO teams VALUES(2,'Operations');
CREATE TABLE employees (
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
INSERT INTO employees VALUES(1,'Alice Njoroge','Engineering Manager',1,NULL,'2024-01-10',95000.0,'full_time',1,'2026-07-27 09:32:11');
INSERT INTO employees VALUES(2,'Brian Otieno','Software Engineer',1,1,'2024-03-01',65000.0,'full_time',1,'2026-07-27 09:32:11');
INSERT INTO employees VALUES(3,'Carol Wambui','Operations Lead',2,NULL,'2023-06-15',55000.0,'full_time',0,'2026-07-27 09:32:11');
INSERT INTO employees VALUES(4,'David Kiptoo','Operations Analyst',2,3,'2026-07-15',42000.0,'contract',1,'2026-07-27 09:32:11');
CREATE TABLE leave_requests (
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
INSERT INTO leave_requests VALUES(1,2,'2026-07-28','2026-07-29',2,'unpaid','approved','Personal matters','2026-07-27 09:32:11','2026-07-27 09:32:11',1);
INSERT INTO leave_requests VALUES(2,4,'2026-08-01','2026-08-02',2,'paid','pending','Family event','2026-07-27 09:32:11',NULL,NULL);
INSERT INTO leave_requests VALUES(3,3,'2026-08-16','2026-08-21',6,'unpaid','rejected',NULL,'2026-07-27 09:32:11','2026-07-27 09:32:11',1);
CREATE TABLE payroll_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_month INTEGER NOT NULL,
    period_year INTEGER NOT NULL,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_month, period_year)
);
INSERT INTO payroll_runs VALUES(1,7,2026,'2026-07-27 09:32:11');
CREATE TABLE payslips (
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
INSERT INTO payslips VALUES(1,1,1,95000.0,0,16150.0,2160.0,76690.0,'2026-07-27 09:32:11');
INSERT INTO payslips VALUES(2,1,2,60806.45,2,7601.61,2160.0,51044.84,'2026-07-27 09:32:11');
INSERT INTO payslips VALUES(3,1,3,55000.0,0,6150.0,2160.0,46690.0,'2026-07-27 09:32:11');
INSERT INTO payslips VALUES(4,1,4,23032.26,0,0.0,1381.94,21650.32,'2026-07-27 09:32:11');
PRAGMA writable_schema=ON;
CREATE TABLE IF NOT EXISTS sqlite_sequence(name,seq);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('teams',2);
INSERT INTO sqlite_sequence VALUES('employees',4);
INSERT INTO sqlite_sequence VALUES('leave_requests',3);
INSERT INTO sqlite_sequence VALUES('payroll_runs',1);
INSERT INTO sqlite_sequence VALUES('payslips',4);
PRAGMA writable_schema=OFF;
COMMIT;
