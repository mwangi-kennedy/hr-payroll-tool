const db = require('../db');
const { calculateTax, calculateSocialSecurity, daysInMonth, daysBetween, overlapDays } = require('../services/payrollRules');

async function getUnpaidLeaveDays(employeeId, rangeStart, rangeEnd) {
    const { rows } = await db.query(`
        SELECT * FROM leave_requests
        WHERE employee_id = $1 AND status = 'approved' AND leave_type = 'unpaid'
        AND start_date <= $2 AND end_date >= $3
    `, [employeeId, rangeEnd, rangeStart]);

    return rows.reduce((total, lr) => {
        return total + overlapDays(lr.start_date, lr.end_date, rangeStart, rangeEnd);
    }, 0);
}

async function generatePayroll(req, res) {
    const { month, year } = req.body;

    if (!month || !year || month < 1 || month > 12) {
        return res.status(400).json({ error: 'Valid month (1-12) and year are required' });
    }

    try {
        const { rows: existing } = await db.query('SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2', [month, year]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Payroll already generated for this period', payroll_run_id: existing[0].id });
        }

        const totalDaysInMonth = daysInMonth(year, month);
        const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const periodEnd = `${year}-${String(month).padStart(2, '0')}-${String(totalDaysInMonth).padStart(2, '0')}`;

        const { rows: employees } = await db.query('SELECT * FROM employees WHERE is_active = 1');        const { rows: runRows } = await db.query('INSERT INTO payroll_runs (period_month, period_year) VALUES ($1, $2) RETURNING id', [month, year]);
        const payrollRunId = runRows[0].id;

        const payslips = [];

        for (const emp of employees) {
            const empSalary = parseFloat(emp.salary);

            const empStartDate = emp.start_date instanceof Date
                ? emp.start_date.toISOString().split('T')[0]
                : String(emp.start_date).split('T')[0];

            const workedStart = empStartDate > periodStart ? empStartDate : periodStart;
            if (workedStart > periodEnd) continue;

            const workedDays = daysBetween(workedStart, periodEnd);
            const dailyRate = empSalary / totalDaysInMonth;

            const unpaidLeaveDays = await getUnpaidLeaveDays(emp.id, workedStart, periodEnd);
            const effectiveDays = Math.max(0, workedDays - unpaidLeaveDays);

            const grossPay = Math.round(dailyRate * effectiveDays * 100) / 100;
            const tax = calculateTax(grossPay);
            const socialSecurity = calculateSocialSecurity(grossPay);
            const netPay = Math.round((grossPay - tax - socialSecurity) * 100) / 100;

            await db.query(`
                INSERT INTO payslips (payroll_run_id, employee_id, gross_pay, unpaid_leave_days, tax_deduction, social_security_deduction, net_pay)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [payrollRunId, emp.id, grossPay, unpaidLeaveDays, tax, socialSecurity, netPay]);

            payslips.push({ employee_id: emp.id, name: emp.name, gross_pay: grossPay, unpaid_leave_days: unpaidLeaveDays, tax_deduction: tax, social_security_deduction: socialSecurity, net_pay: netPay });
        }

        res.status(201).json({ payroll_run_id: payrollRunId, month, year, payslips });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getPayrollForPeriod(req, res) {
    const { year, month } = req.params;
    try {
        const { rows: runRows } = await db.query('SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2', [month, year]);
        if (runRows.length === 0) return res.status(404).json({ error: 'No payroll generated for this period yet' });

        const run = runRows[0];
        const { rows: payslips } = await db.query(`
            SELECT p.*, e.name, e.role FROM payslips p
            JOIN employees e ON e.id = p.employee_id
            WHERE p.payroll_run_id = $1
        `, [run.id]);

        res.json({ payroll_run_id: run.id, month: run.period_month, year: run.period_year, payslips });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function listPayrollRuns(req, res) {
    try {
        const { rows } = await db.query('SELECT * FROM payroll_runs ORDER BY period_year DESC, period_month DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function downloadPayslipsCsv(req, res) {
    const { year, month } = req.params;
    try {
        const { rows: runRows } = await db.query('SELECT * FROM payroll_runs WHERE period_month = $1 AND period_year = $2', [month, year]);
        if (runRows.length === 0) return res.status(404).json({ error: 'No payroll generated for this period yet' });

        const run = runRows[0];
        const { rows: payslips } = await db.query(`
            SELECT p.*, e.name, e.role FROM payslips p
            JOIN employees e ON e.id = p.employee_id
            WHERE p.payroll_run_id = $1
        `, [run.id]);

        const header = 'Employee,Role,Gross Pay,Unpaid Leave Days,Tax,Social Security,Net Pay\n';
        const rows = payslips.map(p =>
            `"${p.name}","${p.role}",${p.gross_pay},${p.unpaid_leave_days},${p.tax_deduction},${p.social_security_deduction},${p.net_pay}`
        ).join('\n');

        const filename = `payroll_${year}_${String(month).padStart(2, '0')}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(header + rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { generatePayroll, getPayrollForPeriod, listPayrollRuns, downloadPayslipsCsv };