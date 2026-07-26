const db = require('../db');
const {
    calculateTax, calculateSocialSecurity, daysInMonth, daysBetween, overlapDays
} = require('../services/payrollRules');

function getUnpaidLeaveDays(employeeId, rangeStart, rangeEnd) {
    const leaveRequests = db.prepare(`
        SELECT * FROM leave_requests
        WHERE employee_id = ? AND status = 'approved' AND leave_type = 'unpaid'
        AND start_date <= ? AND end_date >= ?
    `).all(employeeId, rangeEnd, rangeStart);

    return leaveRequests.reduce((total, lr) => {
        return total + overlapDays(lr.start_date, lr.end_date, rangeStart, rangeEnd);
    }, 0);
}

function generatePayroll(req, res) {
    const { month, year } = req.body;

    if (!month || !year || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid month (1-12) and year are required' });
    }

    const existingRun = db.prepare('SELECT * FROM payroll_runs WHERE period_month = ? AND period_year = ?').get(month, year);
    if (existingRun) {
        return res.status(409).json({ error: 'Payroll already generated for this period', payroll_run_id: existingRun.id });
    }

    const totalDaysInMonth = daysInMonth(year, month);
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

    const employees = db.prepare('SELECT * FROM employees WHERE is_active = 1').all();
    const runResult = db.prepare('INSERT INTO payroll_runs (period_month, period_year) VALUES (?, ?)').run(month, year);
    const payrollRunId = runResult.lastInsertRowid;

    const payslips = [];

    for (const emp of employees) {
        const workedStart = emp.start_date > periodStart ? emp.start_date : periodStart;
        if (workedStart > periodEnd) continue; // not yet employed this period

        const workedDays = daysBetween(workedStart, periodEnd);
        const dailyRate = emp.salary / totalDaysInMonth;

        const unpaidLeaveDays = getUnpaidLeaveDays(emp.id, workedStart, periodEnd);
        const effectiveDays = Math.max(0, workedDays - unpaidLeaveDays);

        const grossPay = Math.round(dailyRate * effectiveDays * 100) / 100;
        const tax = calculateTax(grossPay);
        const socialSecurity = calculateSocialSecurity(grossPay);
        const netPay = Math.round((grossPay - tax - socialSecurity) * 100) / 100;

        db.prepare(`
            INSERT INTO payslips (payroll_run_id, employee_id, gross_pay, unpaid_leave_days, tax_deduction, social_security_deduction, net_pay)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(payrollRunId, emp.id, grossPay, unpaidLeaveDays, tax, socialSecurity, netPay);

        payslips.push({ employee_id: emp.id, name: emp.name, gross_pay: grossPay, unpaid_leave_days: unpaidLeaveDays, tax_deduction: tax, social_security_deduction: socialSecurity, net_pay: netPay });
    }

    res.status(201).json({ payroll_run_id: payrollRunId, month, year, payslips });
}

function getPayrollForPeriod(req, res) {
    const { year, month } = req.params;
    const run = db.prepare('SELECT * FROM payroll_runs WHERE period_month = ? AND period_year = ?').get(month, year);
    if (!run) return res.status(404).json({ error: 'No payroll generated for this period yet' });

    const payslips = db.prepare(`
        SELECT p.*, e.name, e.role FROM payslips p
        JOIN employees e ON e.id = p.employee_id
        WHERE p.payroll_run_id = ?
    `).all(run.id);

    res.json({ payroll_run_id: run.id, month: run.period_month, year: run.period_year, payslips });
}

function listPayrollRuns(req, res) {
    res.json(db.prepare('SELECT * FROM payroll_runs ORDER BY period_year DESC, period_month DESC').all());
}

module.exports = { generatePayroll, getPayrollForPeriod, listPayrollRuns };