process.env.DB_PATH = ':memory:';
const request = require('supertest');
const fs = require('fs');
const path = require('path');

const db = require('../db');
db.exec(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));

const app = require('../app');

describe('Leave Management', () => {
    let employeeId;

    beforeAll(() => {
        const team = db.prepare('INSERT INTO teams (name) VALUES (?)').run('Engineering');
        const emp = db.prepare(`
            INSERT INTO employees (name, role, team_id, start_date, salary, employment_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run('Test Employee', 'Engineer', team.lastInsertRowid, '2026-01-01', 50000, 'full_time');
        employeeId = emp.lastInsertRowid;
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