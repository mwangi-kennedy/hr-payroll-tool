CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    team_id INT REFERENCES teams(id) ON DELETE SET NULL,
    manager_id INT REFERENCES employees(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    salary NUMERIC(12, 2) NOT NULL,
    employment_type VARCHAR(50) NOT NULL,
    is_active INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,
    decided_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id SERIAL PRIMARY KEY,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(period_month, period_year)
);

CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    payroll_run_id INT NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    gross_pay NUMERIC(12, 2) NOT NULL,
    unpaid_leave_days INT DEFAULT 0,
    tax_deduction NUMERIC(12, 2) NOT NULL,
    social_security_deduction NUMERIC(12, 2) NOT NULL,
    net_pay NUMERIC(12, 2) NOT NULL
);