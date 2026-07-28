CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  salary NUMERIC(10, 2) NOT NULL,
  start_date DATE NOT NULL,
  team_id INT REFERENCES teams(id) ON DELETE SET NULL,
  manager_id INT REFERENCES employees(id) ON DELETE SET NULL,
  is_active INT DEFAULT 1,
  employment_type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id SERIAL PRIMARY KEY,
  month INT NOT NULL,
  year INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(month, year)
);

CREATE TABLE IF NOT EXISTS payslips (
  id SERIAL PRIMARY KEY,
  payroll_run_id INT REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id INT REFERENCES employees(id) ON DELETE CASCADE,
  gross_pay NUMERIC(10, 2) NOT NULL,
  unpaid_leave_days INT DEFAULT 0,
  net_pay NUMERIC(10, 2)
);