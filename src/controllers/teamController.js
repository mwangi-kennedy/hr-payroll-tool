const db = require('../db');

async function getAllTeams(req, res) {
    try {
        const { rows } = await db.query('SELECT * FROM teams ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createTeam(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    try {
        const { rows } = await db.query(
            'INSERT INTO teams (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Postgres unique violation error code
            return res.status(409).json({ error: 'Team name already exists' });
        }
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getAllTeams, createTeam };