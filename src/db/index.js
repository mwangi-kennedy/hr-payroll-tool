require('dotenv').config();
const { Pool } = require('pg');

const { types } = require('pg');
types.setTypeParser(1082, val => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};