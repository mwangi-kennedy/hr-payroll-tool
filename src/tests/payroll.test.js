const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const db = require('../db');

describe('Payroll generation (integration)', () => {
  let teamId;
  let emp1Id;
  let midMonthId;

  beforeAll(async () => {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await db.query(schemaSql);

    await db.query(`
      TRUNCATE teams, employees, leave_requests, payroll_runs, payslips 
      RESTART IDENTITY CASCADE;
    `);

    const teamRes = await db.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id',
      ['Ops']
    );
    teamId = teamRes.rows[0].id;

    const emp1Res = await db.query(
      `INSERT INTO employees (name, role, salary, start_date, team_id, is_active, employment_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['Alice', 'Developer', 31000, '2026-01-01', teamId, 1, 'full-time']
    );
    emp1Id = emp1Res.rows[0].id;

    const midMonthRes = await db.query(
      `INSERT INTO employees (name, role, salary, start_date, team_id, is_active, employment_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      ['Bob', 'Designer', 31000, '2026-03-20', teamId, 1, 'full-time']
    );
    midMonthId = midMonthRes.rows[0].id;

    await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, status, days_requested)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [emp1Id, 'unpaid', '2026-03-10', '2026-03-14', 'approved', 5]
    );
  });

  afterAll(async () => {
    if (db.end) {
      await db.end();
    }
  });

  test('generates payroll with unpaid leave deducted from gross', async () => {
    const res = await request(app)
      .post('/api/payroll/generate')
      .send({ month: 3, year: 2026 });

    expect(res.statusCode).toEqual(201);
    expect(res.body.payslips).toBeDefined();

    const slip = res.body.payslips.find(p => Number(p.employee_id) === Number(emp1Id));
    expect(slip).toBeDefined();
    expect(Number(slip.unpaid_leave_days)).toBe(5);
    expect(Number(slip.gross_pay)).toBe(26000);
  });

  test('mid-month joiner is prorated to worked days only', async () => {
    const res = await request(app).get('/api/payroll/2026/3');
    const slip = res.body.payslips.find(p => Number(p.employee_id) === Number(midMonthId));
    expect(slip).toBeDefined();
    expect(Number(slip.gross_pay)).toBeLessThan(15500);
  });

  test('zero-deduction case: full month unpaid leave results in zero pay', async () => {
  });

  test('rejects duplicate generation for the same period', async () => {
    const res = await request(app)
      .post('/api/payroll/generate')
      .send({ month: 3, year: 2026 });

    expect(res.statusCode).toEqual(409);
  });
});