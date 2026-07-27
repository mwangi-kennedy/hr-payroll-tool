const db = require('../db');

function getAllTeams(req, res) {
    res.json(db.prepare('SELECT * FROM teams').all());
}

function createTeam(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    try {
        const result = db.prepare('INSERT INTO teams (name) VALUES (?)').run(name);
        res.status(201).json({ id: result.lastInsertRowid, name });
    } catch (err) {
        res.status(409).json({ error: 'Team name already exists' });
    }
}

module.exports = { getAllTeams, createTeam };