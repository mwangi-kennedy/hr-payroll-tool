require('dotenv').config();
const Database = require('better-sqlite3');
const path = require('path');

const envPath = process.env.DB_PATH;
let resolvedPath;

if (envPath === ':memory:') {
  resolvedPath = ':memory:';
} else if (envPath) {
  resolvedPath = path.resolve(envPath);
} else {
  resolvedPath = path.join(process.cwd(), 'src', 'db', 'database.db');
}

const db = new Database(resolvedPath, { readonly: true, fileMustExist: true });

db.pragma('foreign_keys = ON');

module.exports = db;