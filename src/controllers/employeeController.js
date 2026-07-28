const db = require('../db');

async function getAllEmployees(req, res) {
    try {
        const { rows } = await db.query('SELECT * FROM employees WHERE is_active = 1 ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createEmployee(req, res) {
    const { name, role, team_id, manager_id, start_date, salary, employment_type } = req.body;

    if (!name || !role || !start_date || !salary || !employment_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const { rows } = await db.query(`
            INSERT INTO employees (name, role, team_id, manager_id, start_date, salary, employment_type)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `, [name, role, team_id || null, manager_id || null, start_date, salary, employment_type]);

        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

function buildTree(employees, managerId = null) {
    return employees
        .filter(e => (e.manager_id ?? null) == managerId)
        .map(e => ({
            ...e,
            reports: buildTree(employees, e.id)
        }));
}

async function getOrgView(req, res) {
    try {
        const { rows } = await db.query('SELECT * FROM employees WHERE is_active = 1');
        const tree = buildTree(rows, null);
        res.json(tree);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deactivateEmployee(req, res) {
    const { id } = req.params;
    try {
        const { rows: existing } = await db.query('SELECT * FROM employees WHERE id = $1', [id]);
        if (existing.length === 0) return res.status(404).json({ error: 'Employee not found' });

        const { rows: updated } = await db.query(
            'UPDATE employees SET is_active = 0 WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(updated[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAllEmployees, createEmployee, getOrgView, deactivateEmployee };