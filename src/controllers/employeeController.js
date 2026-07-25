const db = require('../db');

function getAllEmployees(req, res) {
    const employees = db.prepare('SELECT * FROM employees WHERE is_active = 1').all();
    res.json(employees);
}

function createEmployee(req, res) {
    const { name, role, team_id, manager_id, start_date, salary, employment_type } = req.body;

    if (!name || !role || !start_date || !salary || !employment_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.prepare(`
        INSERT INTO employees (name, role, team_id, manager_id, start_date, salary, employment_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, role, team_id || null, manager_id || null, start_date, salary, employment_type);

    const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newEmployee);
}

module.exports = { getAllEmployees, createEmployee };