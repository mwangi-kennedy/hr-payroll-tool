const request = require('supertest');
const fs = require('fs');
const path = require('path');

const db = require('../db');
const app = require('../app');

describe('Leave Management', () => {
  let employeeId;

  beforeAll(async () => {
    const schemaSql = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
    await db.query(schemaSql);

    await db.query(`
      TRUNCATE teams, employees, leave_requests, payroll_runs, payslips 
      RESTART IDENTITY CASCADE;
    `);

    const teamRes = await db.query(
      'INSERT INTO teams (name) VALUES ($1) RETURNING id',
      ['Engineering']
    );
    const teamId = teamRes.rows[0].id;

    const empRes = await db.query(
      `INSERT INTO employees (name, role, team_id, start_date, salary, employment_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['Test Employee', 'Engineer', teamId, '2026-01-01', 50000, 'full_time']
    );
    employeeId = empRes.rows[0].id;
  });

  afterAll(async () => {
    if (db.end) {
      await db.end();
    }
  });

  test('rejects a leave request for a past date', async () => {
    const res = await request(app)
      .post('/api/leave')
      .send({ employee_id: employeeId, start_date: '2020-01-01', end_date: '2020-01-02', leave_type: 'paid' });
    expect(res.status).toBe(400);
  });

  test('creates a valid request and flags low notice', async () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    const startStr = start.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/leave')
      .send({ employee_id: employeeId, start_date: startStr, end_date: startStr, leave_type: 'unpaid' });

    expect(res.status).toBe(201);
    expect(res.body.low_notice).toBe(true);
  });
});