process.env.DB_PATH = ':memory:';
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const db = require('../db');
db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));

const app = require('../app');
const { calculateTax, calculateSocialSecurity } = require('../services/payrollRules');

describe('Payroll math (pure functions)', () => {
    test('no tax in the 0% bracket', () => {
        expect(calculateTax(20000)).toBe(0);
    });

    test('tax calculated progressively across brackets', () => {
        expect(calculateTax(30000)).toBe(900); // 24000@0% + 6000@15%
    });

    test('salary right at a bracket boundary', () => {
        expect(calculateTax(24000)).toBe(0);
        expect(calculateTax(24001)).toBeCloseTo(0.15, 2);
    });

    test('social security is capped', () => {
        expect(calculateSocialSecurity(1000000)).toBe(2160);
    });
});

describe('Payroll generation (integration)', () => {
    let fullMonthId, midMonthId, zeroId;

    beforeAll(() => {
        const team = db.prepare('INSERT INTO teams (name) VALUES (?)').run('Ops');

        fullMonthId = db.prepare(`INSERT INTO employees (name, role, team_id, start_date, salary, employment_type) VALUES (?,?,?,?,?,?)`)
            .run('Full Month Employee', 'Analyst', team.lastInsertRowid, '2025-01-01', 31000, 'full_time').lastInsertRowid;

        midMonthId = db.prepare(`INSERT INTO employees (name, role, team_id, start_date, salary, employment_type) VALUES (?,?,?,?,?,?)`)
            .run('Mid Month Joiner', 'Analyst', team.lastInsertRowid, '2026-03-20', 31000, 'full_time').lastInsertRowid;

        zeroId = db.prepare(`INSERT INTO employees (name, role, team_id, start_date, salary, employment_type) VALUES (?,?,?,?,?,?)`)
            .run('Zero Deduction Employee', 'Analyst', team.lastInsertRowid, '2025-01-01', 31000, 'full_time').lastInsertRowid;

        db.prepare(`INSERT INTO leave_requests (employee_id, start_date, end_date, days_requested, leave_type, status) VALUES (?,?,?,?,?,?)`)
            .run(fullMonthId, '2026-03-05', '2026-03-07', 3, 'unpaid', 'approved');

        db.prepare(`INSERT INTO leave_requests (employee_id, start_date, end_date, days_requested, leave_type, status) VALUES (?,?,?,?,?,?)`)
            .run(zeroId, '2026-03-01', '2026-03-31', 31, 'unpaid', 'approved');
    });

    test('generates payroll with unpaid leave deducted from gross', async () => {
        const res = await request(app).post('/api/payroll/generate').send({ month: 3, year: 2026 });
        expect(res.status).toBe(201);

        const slip = res.body.payslips.find(p => p.employee_id === fullMonthId);
        expect(slip.unpaid_leave_days).toBe(3);
        expect(slip.gross_pay).toBeLessThan(31000);
    });

    test('mid-month joiner is prorated to worked days only', async () => {
        const res = await request(app).get('/api/payroll/2026/3');
        const slip = res.body.payslips.find(p => p.employee_id === midMonthId);
        expect(slip.gross_pay).toBeLessThan(15500); // less than half the month
    });

    test('zero-deduction case: full month unpaid leave results in zero pay', async () => {
        const res = await request(app).get('/api/payroll/2026/3');
        const slip = res.body.payslips.find(p => p.employee_id === zeroId);
        expect(slip.gross_pay).toBe(0);
        expect(slip.tax_deduction).toBe(0);
        expect(slip.net_pay).toBe(0);
    });

    test('rejects duplicate generation for the same period', async () => {
        const res = await request(app).post('/api/payroll/generate').send({ month: 3, year: 2026 });
        expect(res.status).toBe(409);
    });
});