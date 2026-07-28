require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./index');

async function migrate() {
    try {
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await db.query(schema);
        console.log('Migration complete. Clean Postgres tables created.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();