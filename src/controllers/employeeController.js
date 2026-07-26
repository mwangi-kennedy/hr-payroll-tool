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

function buildTree(employees, managerId = null) {
    return employees
        .filter(e => e.manager_id === managerId)
        .map(e => ({
            ...e,
            reports: buildTree(employees, e.id)
        }));
}

function getOrgView(req, res) {
    const employees = db.prepare('SELECT * FROM employees WHERE is_active = 1').all();
    const tree = buildTree(employees, null);
    res.json(tree);
}

function deactivateEmployee(req, res) {
    const { id } = req.params;
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    db.prepare('UPDATE employees SET is_active = 0 WHERE id = ?').run(id);
    const updated = db.prepare('SELECT * FROM employees WHERE id = ?').get(id);
    res.json(updated);
}

module.exports = { getAllEmployees, createEmployee, getOrgView, deactivateEmployee };