require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './src/db/database.db';
const db = new Database(path.resolve(dbPath));

db.pragma('foreign_keys = ON');

module.exports = db;